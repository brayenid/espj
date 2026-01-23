/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'

import { getTelaahanForCurrentUser } from '@/server/spj/telaahan'
import { buildTelaahanStafDocument } from '@/pdf/telaahan-staf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const result = await getTelaahanForCurrentUser(id)

  if (result.status !== 'OK') {
    return NextResponse.json({ ok: false, status: result.status }, { status: 403 })
  }

  if (!result.telaahan) {
    return NextResponse.json({ ok: false, message: 'Telaahan belum diisi.' }, { status: 400 })
  }

  // Data Telaahan dari DB
  const t = result.telaahan

  const doc = buildTelaahanStafDocument({
    spj: {
      kotaTandaTangan: result.spj.kotaTandaTangan,
      tglSuratTugas: result.spj.tglSuratTugas,
      noTelaahan: result.spj.noTelaahan ?? null
    },
    telaahan: {
      kepada: t.kepada,
      sifat: t.sifat,
      lampiran: t.lampiran,
      perihal: t.perihal,
      dasar: t.dasar,
      praAnggapan: t.praAnggapan ?? [],
      fakta: t.fakta ?? [],
      analisis: t.analisis,
      kesimpulan: t.kesimpulan,
      saran: t.saran,
      tglTelaahan: t.tglTelaahan ? new Date(t.tglTelaahan) : undefined
    },
    roster: result.roster as any,
    // SEKARANG: Kirim data signer dari snapshot telaahan
    signer: {
      nama: t.signerNama ?? '',
      nip: t.signerNip,
      jabatan: t.signerJabatan,
      pangkat: t.signerPangkat,
      golongan: t.signerGolongan,
      jabatanTampil: t.signerJabatanTampil
    }
  })

  const stream = await renderToStream(doc)

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="telaahan-staf-${id}.pdf"`
    }
  })
}
