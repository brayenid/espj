import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { getSpjDetailForCurrentUser } from '@/server/spj/queries'
import { buildSpdDocument } from '@/pdf/spd'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SPD_ROLE_KEY = 'PEMBERI_PERINTAH'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const access = await getSpjDetailForCurrentUser(id)
  if (access.status !== 'OK') {
    return NextResponse.json({ ok: false, status: access.status }, { status: 403 })
  }

  const [roster, signer] = await Promise.all([
    prisma.spjRosterItem.findMany({
      where: { spjId: id },
      orderBy: [{ role: 'asc' }, { order: 'asc' }],
      select: {
        id: true,
        order: true,
        role: true,
        nama: true,
        nip: true,
        jabatan: true,
        pangkat: true,
        golongan: true,
        instansi: true
      }
    }),
    prisma.spjSigner.findFirst({
      where: { spjId: id, docType: 'SPD', order: 1, roleKey: SPD_ROLE_KEY },
      select: {
        nama: true,
        nip: true,
        jabatan: true,
        pangkat: true,
        golongan: true,
        instansi: true,
        jabatanTampil: true
      }
    })
  ])

  const doc = buildSpdDocument({
    spj: {
      noSpd: access.spj.noSpd ?? null,
      tglSpd: access.spj.tglSpd,
      kotaTandaTangan: access.spj.kotaTandaTangan,
      tempatBerangkat: access.spj.tempatBerangkat,
      tempatTujuan: access.spj.tempatTujuan,
      maksudDinas: access.spj.maksudDinas,
      alatAngkut: access.spj.alatAngkut,
      lamaPerjalanan: access.spj.lamaPerjalanan,
      tglBerangkat: access.spj.tglBerangkat,
      tglKembali: access.spj.tglKembali,
      akunAnggaran: access.spj.akunAnggaran ?? null
    },
    roster,
    signer: signer ?? null
  })

  const stream = await renderToStream(doc)

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="spd-${id}.pdf"`
    }
  })
}
