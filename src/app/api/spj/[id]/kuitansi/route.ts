import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const PayloadSchema = z.object({
  tanggalKuitansi: z.string().nullable().optional(), // ex: "2026-01-10" (input type="date") atau null

  spjMaster: z
    .object({
      tahunAnggaran: z.string().nullable().optional(),
      kodeKegiatan: z.string().nullable().optional(),
      judulKegiatan: z.string().nullable().optional(),
      kodeSubKegiatan: z.string().nullable().optional(),
      judulSubKegiatan: z.string().nullable().optional(),
      upGu: z.string().nullable().optional(),
      nomorBku: z.string().nullable().optional(),
      kodeRekening: z.string().nullable().optional(),
      judulRekening: z.string().nullable().optional()
    })
    .optional(),

  signers: z
    .array(
      z.object({
        order: z.number().int().min(1).max(2), // 1=KPA, 2=BPP
        pegawaiId: z.string().nullable()
      })
    )
    .optional()
})

function cleanNullableString(v?: string | null) {
  const s = (v ?? '').trim()
  return s.length ? s : null
}

function parseDateOrNull(v?: string | null) {
  const s = (v ?? '').trim()
  if (!s) return null
  // asumsikan input date -> "YYYY-MM-DD"
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d
}

async function ensureOwner(spjId: string, userId: string, role: string) {
  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: { id: true, createdById: true }
  })
  if (!spj) return { ok: false, status: 404 as const }
  if (role !== 'SUPER_ADMIN' && spj.createdById !== userId) return { ok: false, status: 403 as const }
  return { ok: true, status: 200 as const }
}

function roleKeyFor(order: number) {
  // roleKey WAJIB ada di schema kamu, tapi UI tidak perlu mikirin ini
  return order === 1 ? 'KPA' : 'BPP'
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: spjId } = await ctx.params

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const guard = await ensureOwner(spjId, session.user.id, session.user.role as string)
  if (!guard.ok) return NextResponse.json({ message: 'Forbidden' }, { status: guard.status })

  const body = await req.json()
  const parsed = PayloadSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })

  const payload = parsed.data

  // 1) Update SPJ master (anggaran)
  if (payload.spjMaster) {
    await prisma.spj.update({
      where: { id: spjId },
      data: {
        tahunAnggaran: cleanNullableString(payload.spjMaster.tahunAnggaran),
        kodeKegiatan: cleanNullableString(payload.spjMaster.kodeKegiatan),
        judulKegiatan: cleanNullableString(payload.spjMaster.judulKegiatan),
        kodeSubKegiatan: cleanNullableString(payload.spjMaster.kodeSubKegiatan),
        judulSubKegiatan: cleanNullableString(payload.spjMaster.judulSubKegiatan),
        upGu: cleanNullableString(payload.spjMaster.upGu),
        nomorBku: cleanNullableString(payload.spjMaster.nomorBku),
        kodeRekening: cleanNullableString(payload.spjMaster.kodeRekening),
        judulRekening: cleanNullableString(payload.spjMaster.judulRekening)
      }
    })
  }

  // 2) Upsert Kuitansi
  const tanggal = parseDateOrNull(payload.tanggalKuitansi)

  await prisma.spjKuitansi.upsert({
    where: { spjId },
    create: { spjId, tanggalKuitansi: tanggal },
    update: { tanggalKuitansi: tanggal }
  })

  // 3) Upsert Signers (docType=KUITANSI)
  // jika pegawaiId null -> delete signer slot tsb (biar PDF tampil kosong)
  if (payload.signers?.length) {
    for (const s of payload.signers) {
      const roleKey = roleKeyFor(s.order)

      if (!s.pegawaiId) {
        await prisma.spjSigner.deleteMany({
          where: { spjId, docType: 'KUITANSI', order: s.order, roleKey }
        })
        continue
      }

      const p = await prisma.pegawai.findUnique({
        where: { id: s.pegawaiId },
        select: {
          id: true,
          nama: true,
          nip: true,
          jabatan: true,
          golongan: true,
          pangkat: true,
          instansi: true
        }
      })
      if (!p) return NextResponse.json({ message: 'Pegawai tidak ditemukan' }, { status: 400 })

      const snapshot = {
        pegawaiId: p.id,
        nama: p.nama,
        nip: p.nip,
        jabatan: p.jabatan,
        golongan: p.golongan,
        pangkat: p.pangkat,
        instansi: p.instansi,
        jabatanTampil: null as string | null
      }

      await prisma.spjSigner.upsert({
        where: {
          spjId_docType_order_roleKey: {
            spjId,
            docType: 'KUITANSI',
            order: s.order,
            roleKey
          }
        },
        create: {
          spjId,
          docType: 'KUITANSI',
          order: s.order,
          roleKey,
          ...snapshot
        },
        update: {
          ...snapshot
        }
      })
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
