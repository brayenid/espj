// src/app/(dashboard)/spj/[id]/dopd/print/route.tsx
import React from 'react'
import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import DopdPdf from '@/pdf/dopd'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ensureOwner(spjId: string, userId: string, role: string) {
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

  const guard = await ensureOwner(spjId, session.user.id, String(session.user.role))
  if (!guard.ok) return NextResponse.json({ message: 'Forbidden' }, { status: guard.status })

  // ====== Load data (sesuai schema prisma kamu)
  const [rosterRows, itemRows, signerRows, spj] = await Promise.all([
    prisma.spjRosterItem.findMany({
      where: { spjId },
      orderBy: [{ role: 'asc' }, { order: 'asc' }],
      select: {
        id: true,
        order: true,
        role: true,
        nama: true,
        nip: true,
        jabatan: true,
        pangkat: true,
        golongan: true
      }
    }),

    prisma.rincianBiayaItem.findMany({
      where: { spjId },
      orderBy: [{ rosterItem: { order: 'asc' } }, { kategori: 'asc' }, { uraian: 'asc' }],
      select: {
        id: true,
        rosterItemId: true,
        kategori: true,
        uraian: true,
        hargaSatuan: true,
        total: true,
        factors: {
          orderBy: { order: 'asc' },
          select: { id: true, order: true, label: true, qty: true }
        }
      }
    }),

    prisma.spjSigner.findMany({
      where: { spjId, docType: 'DOPD' },
      orderBy: [{ order: 'asc' }],
      select: {
        order: true,
        nama: true,
        nip: true,
        jabatan: true,
        jabatanTampil: true
      }
    }),

    prisma.spj.findFirst({
      where: {
        id: spjId
      },
      select: {
        spjSuratTugas: {
          select: {
            signerJabatan: true
          }
        },
        tingkatPerjalanan: true
      }
    })
  ])

  // ====== Normalisasi props agar TIDAK mungkin undefined
  const roster = rosterRows ?? []

  const items = (itemRows ?? []).map((it) => ({
    id: it.id,
    rosterItemId: it.rosterItemId,
    kategori: it.kategori,
    uraian: it.uraian,
    hargaSatuan: it.hargaSatuan,
    total: it.total, // sudah cache di DB
    factors: (it.factors ?? []).map((f) => ({
      id: f.id,
      order: f.order,
      label: f.label,
      qty: f.qty
    }))
  }))

  const kpaRow = signerRows.find((s) => s.order === 1) ?? null
  const bppRow = signerRows.find((s) => s.order === 2) ?? null

  const pejabatMemberiPerintahLabel = spj?.spjSuratTugas?.signerJabatan ?? ''
  const tingkatPerjalananLabel = spj?.tingkatPerjalanan ?? ''
  const doc = (
    <DopdPdf
      spj={{
        pejabatMemberiPerintahLabel,
        tingkatPerjalananLabel
      }}
      roster={roster}
      items={items} // ✅ dipastikan array
      signers={{
        kpa: kpaRow ? { nama: kpaRow.nama, nip: kpaRow.nip } : null,
        bpp: bppRow ? { nama: bppRow.nama, nip: bppRow.nip } : null
      }}
    />
  )

  const stream = await renderToStream(doc)

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="DOPD-${spjId}.pdf"`,
      'Cache-Control': 'no-store'
    }
  })
}
