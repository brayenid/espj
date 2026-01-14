import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'

import { getSuratTugasForCurrentUser } from '@/server/spj/surat-tugas'
import { buildSuratTugasDocument } from '@/pdf/surat-tugas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const result = await getSuratTugasForCurrentUser(id)
  if (result.status !== 'OK') {
    return NextResponse.json({ ok: false, status: result.status }, { status: 403 })
  }

  // jika belum ada, bikin “virtual” dari spj biar tetap bisa preview
  const st = result.suratTugas ?? {
    untuk: result.spj.maksudDinas,
    assignedRosterItemId: result.roster.find((r) => r.role === 'KEPALA_JALAN')?.id ?? result.roster[0]?.id ?? null,
    signerNama: '-',
    signerNip: null,
    signerJabatan: 'Sekretaris Daerah',
    signerPangkatGolongan: '-'
  }

  const rosterSorted = [...result.roster].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'KEPALA_JALAN' ? -1 : 1
    return a.order - b.order
  })

  const doc = buildSuratTugasDocument({
    spj: {
      kotaTandaTangan: result.spj.kotaTandaTangan,
      tempatTujuan: result.spj.tempatTujuan,
      tempatBerangkat: result.spj.tempatBerangkat,
      alatAngkut: result.spj.alatAngkut,
      lamaPerjalanan: result.spj.lamaPerjalanan,
      akunAnggaran: result.spj.akunAnggaran ?? null,
      tglBerangkat: result.spj.tglBerangkat,
      tglKembali: result.spj.tglKembali,
      tglSuratTugas: result.spj.tglSuratTugas,
      noSuratTugas: result.spj.noSuratTugas
    },
    suratTugas: st,
    roster: rosterSorted
  })

  let stream: unknown
  try {
    stream = await renderToStream(doc)
  } catch (e) {
    console.error('PDF render error:', e)
    return NextResponse.json({ ok: false, message: 'Gagal render PDF' }, { status: 500 })
  }

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="surat-tugas-${id}.pdf"`
    }
  })
}
