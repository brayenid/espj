// src/app/(dashboard)/spj/[id]/visum/print/route.tsx
import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

import VisumPdf from '@/pdf/visum'

async function ensureOwnerOrAdmin(spjId: string, userId: string, role: string) {
  if (!spjId) return { ok: false as const, status: 400 as const }

  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: { id: true, createdById: true }
  })

  if (!spj) return { ok: false as const, status: 404 as const }
  if (role !== 'SUPER_ADMIN' && spj.createdById !== userId) return { ok: false as const, status: 403 as const }

  return { ok: true as const, status: 200 as const }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: spjId } = await ctx.params

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const guard = await ensureOwnerOrAdmin(spjId, session.user.id, session.user.role as string)
  if (!guard.ok) return NextResponse.json({ message: 'Forbidden' }, { status: guard.status })

  // Ambil data minimal yg dibutuhkan PDF
  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: {
      tempatBerangkat: true,
      tempatTujuan: true,

      // kalau visum belum ada record, default stageCount=4
      visum: { select: { stageCount: true } },

      // ini asumsi paling masuk akal: penandatangan visum sama dengan penandatangan surat tugas (snapshot)
      spjSuratTugas: {
        select: {
          signerNama: true,
          signerNip: true,
          signerJabatan: true
        }
      }
    }
  })

  if (!spj) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const stageCount = spj.visum?.stageCount ?? 4

  const signer = spj.spjSuratTugas?.signerNama
    ? {
        nama: spj.spjSuratTugas.signerNama,
        nip: spj.spjSuratTugas.signerNip ?? null,
        jabatan: spj.spjSuratTugas.signerJabatan
      }
    : null

  const doc = (
    <VisumPdf
      spj={{
        tempatBerangkat: spj.tempatBerangkat,
        tempatTujuan: spj.tempatTujuan
      }}
      stageCount={stageCount}
      signer={signer}
    />
  )

  const stream = await renderToStream(doc)

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="visum-${spjId}.pdf"`
    }
  })
}
