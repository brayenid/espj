import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSpjDetailForCurrentUser } from '@/server/spj/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SPD_ROLE_KEY = 'PEMBERI_PERINTAH'

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const access = await getSpjDetailForCurrentUser(id)
  if (access.status !== 'OK') {
    return NextResponse.json({ ok: false, status: access.status }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  const { noSpd, tglSpd, kotaTandaTangan, signerPegawaiId } = body as {
    noSpd?: string | null
    tglSpd?: string // yyyy-mm-dd
    kotaTandaTangan?: string
    signerPegawaiId?: string | null
  }

  await prisma.spj.update({
    where: { id },
    data: {
      noSpd: (noSpd ?? '').trim() ? (noSpd ?? '').trim() : null,
      tglSpd: tglSpd ? new Date(tglSpd) : access.spj.tglSpd,
      kotaTandaTangan: (kotaTandaTangan ?? '').trim() ? kotaTandaTangan!.trim() : access.spj.kotaTandaTangan
    },
    select: { id: true }
  })

  // signer optional: kalau kosong -> delete row SPD signer
  if (!signerPegawaiId) {
    await prisma.spjSigner.deleteMany({
      where: { spjId: id, docType: 'SPD', order: 1, roleKey: SPD_ROLE_KEY }
    })
    return NextResponse.json({ ok: true })
  }

  const p = await prisma.pegawai.findUnique({
    where: { id: signerPegawaiId },
    select: {
      id: true,
      nama: true,
      nip: true,
      jabatan: true,
      pangkat: true,
      golongan: true,
      instansi: true
    }
  })
  if (!p) return NextResponse.json({ ok: false, message: 'Pegawai tidak ditemukan' }, { status: 400 })

  await prisma.spjSigner.upsert({
    where: {
      spjId_docType_order_roleKey: {
        spjId: id,
        docType: 'SPD',
        order: 1,
        roleKey: SPD_ROLE_KEY
      }
    },
    create: {
      spjId: id,
      docType: 'SPD',
      order: 1,
      roleKey: SPD_ROLE_KEY,
      pegawaiId: p.id,
      nama: p.nama,
      nip: p.nip ?? null,
      jabatan: p.jabatan,
      pangkat: p.pangkat ?? null,
      golongan: p.golongan ?? null,
      instansi: p.instansi ?? null,
      jabatanTampil: null
    },
    update: {
      pegawaiId: p.id,
      nama: p.nama,
      nip: p.nip ?? null,
      jabatan: p.jabatan,
      pangkat: p.pangkat ?? null,
      golongan: p.golongan ?? null,
      instansi: p.instansi ?? null
    },
    select: { id: true }
  })

  return NextResponse.json({ ok: true })
}
