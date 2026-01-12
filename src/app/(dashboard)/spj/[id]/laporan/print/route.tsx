// src/app/(dashboard)/spj/[id]/laporan/print/route.ts
import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import LaporanPdf from '@/pdf/laporan'

async function ensureOwner(spjId: string, userId: string, role: string) {
  if (!spjId) return { ok: false, status: 400 as const }
  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: { id: true, createdById: true }
  })
  if (!spj) return { ok: false, status: 404 as const }
  if (role !== 'SUPER_ADMIN' && spj.createdById !== userId) return { ok: false, status: 403 as const }
  return { ok: true, status: 200 as const }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: spjId } = await ctx.params

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const guard = await ensureOwner(spjId, session.user.id, session.user.role as string)
  if (!guard.ok) return NextResponse.json({ message: 'Forbidden' }, { status: guard.status })

  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: {
      id: true,
      noSuratTugas: true,
      laporan: true,
      roster: {
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
      }
    }
  })

  if (!spj) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  // IMPORTANT: pastikan roster/items iterable
  const roster = Array.isArray(spj.roster) ? spj.roster : []

  const doc = <LaporanPdf spj={{ noSuratTugas: spj.noSuratTugas ?? null }} roster={roster} laporan={spj.laporan} />

  const stream = await renderToStream(doc)

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="laporan-${spjId}.pdf"`
    }
  })
}
