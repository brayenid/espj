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

  const doc = buildTelaahanStafDocument({
    spj: {
      kotaTandaTangan: result.spj.kotaTandaTangan,
      tglSuratTugas: result.spj.tglSuratTugas,
      noTelaahan: result.spj.noTelaahan ?? null
    },
    telaahan: {
      ...result.telaahan,
      praAnggapan: result.telaahan.praAnggapan ?? [],
      fakta: result.telaahan.fakta ?? []
    },
    roster: result.roster,
    signer: null
  })

  const stream = await renderToStream(doc)

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="telaahan-staf-${id}.pdf"`
    }
  })
}
