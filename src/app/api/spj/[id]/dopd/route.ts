// src/app/api/spj/[id]/dopd/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FactorSchema = z.object({
  order: z.number().int().min(1),
  label: z.string().min(1),
  qty: z.number().int().min(1)
})

const ItemSchema = z.object({
  id: z.string().min(1),
  rosterItemId: z.string().min(1),
  kategori: z.string().min(1),
  uraian: z.string().min(1),
  hargaSatuan: z.number().int().min(0),
  factors: z.array(FactorSchema).default([])
})

const Schema = z.object({
  items: z.array(ItemSchema).default([]),
  signers: z
    .array(
      z.object({
        order: z.number().int().min(1),
        pegawaiId: z.string().nullable()
      })
    )
    .default([])
})

function computeTotal(hargaSatuan: number, factors: Array<{ qty: number }>) {
  const mult = factors.reduce((acc, f) => acc * (f.qty > 0 ? f.qty : 1), 1)
  return hargaSatuan * (mult > 0 ? mult : 1)
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

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: spjId } = await ctx.params

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const guard = await ensureOwner(spjId, session.user.id, session.user.role as string)
  if (!guard.ok) return NextResponse.json({ message: 'Forbidden' }, { status: guard.status })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })

  const { items, signers } = parsed.data

  // Validasi rosterItemId milik SPJ
  const rosterIds = new Set(
    (
      await prisma.spjRosterItem.findMany({
        where: { spjId },
        select: { id: true }
      })
    ).map((x) => x.id)
  )

  for (const it of items) {
    if (!rosterIds.has(it.rosterItemId)) {
      return NextResponse.json({ message: 'Roster tidak valid' }, { status: 400 })
    }
  }

  // siapkan data signer: ambil pegawai sekali (lebih cepat & aman dalam tx)
  const signerPegawaiIds = Array.from(new Set(signers.map((s) => s.pegawaiId).filter(Boolean))) as string[]

  try {
    await prisma.$transaction(
      async (tx) => {
        // 1) replace items + factors
        await tx.rincianBiayaFactor.deleteMany({ where: { item: { spjId } } })
        await tx.rincianBiayaItem.deleteMany({ where: { spjId } })

        if (items.length > 0) {
          // create items (bulk)
          await tx.rincianBiayaItem.createMany({
            data: items.map((it) => ({
              id: it.id,
              spjId,
              rosterItemId: it.rosterItemId,
              kategori: it.kategori,
              uraian: it.uraian,
              hargaSatuan: it.hargaSatuan,
              total: computeTotal(it.hargaSatuan, it.factors)
            }))
          })

          // create factors (bulk)
          const flatFactors = items.flatMap((it) =>
            (it.factors ?? []).map((f) => ({
              itemId: it.id,
              order: f.order,
              label: f.label,
              qty: f.qty
            }))
          )

          if (flatFactors.length > 0) {
            await tx.rincianBiayaFactor.createMany({
              data: flatFactors
            })
          }
        }

        // 2) replace signers DOPD
        await tx.spjSigner.deleteMany({ where: { spjId, docType: 'DOPD' } })

        if (signerPegawaiIds.length > 0) {
          const pegawai = await tx.pegawai.findMany({
            where: { id: { in: signerPegawaiIds } },
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

          const pegawaiMap = new Map(pegawai.map((p) => [p.id, p]))

          const signerRows = signers
            .filter((s) => s.pegawaiId)
            .map((s) => {
              const p = pegawaiMap.get(s.pegawaiId as string)
              if (!p) return null
              return {
                spjId,
                docType: 'DOPD' as const,
                order: s.order,
                roleKey: `SIGNER_${s.order}`,
                pegawaiId: p.id,
                nama: p.nama,
                nip: p.nip,
                jabatan: p.jabatan,
                golongan: p.golongan,
                pangkat: p.pangkat,
                instansi: p.instansi
              }
            })
            .filter(Boolean) as Array<{
            spjId: string
            docType: 'DOPD'
            order: number
            roleKey: string
            pegawaiId: string
            nama: string
            nip: string | null
            jabatan: string
            golongan: string | null
            pangkat: string | null
            instansi: string | null
          }>

          if (signerRows.length > 0) {
            await tx.spjSigner.createMany({ data: signerRows })
          }
        }

        return true
      },
      // ✅ penting: naikkan timeout interactive transaction
      { maxWait: 10_000, timeout: 60_000 }
    )
  } catch (e) {
    // optional: log server
    console.error(e)
    return NextResponse.json({ message: 'Gagal menyimpan DOPD' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
