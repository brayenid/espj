/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(dashboard)/spj/[id]/kuitansi/print/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { renderToStream } from '@react-pdf/renderer'
import React from 'react'
import KuitansiPdf from '@/pdf/kuitansi'
import type { SpjDocType } from '@prisma/client'

async function ensureOwner(spjId: string, userId: string, role: string) {
  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: { id: true, createdById: true }
  })
  if (!spj) return { ok: false, status: 404 as const }
  if (role !== 'SUPER_ADMIN' && spj.createdById !== userId) return { ok: false, status: 403 as const }
  return { ok: true, status: 200 as const }
}

function groupKategori(items: Array<{ kategori: string; total: number }>) {
  const map = new Map<string, number>()
  for (const it of items ?? []) {
    const k = (it.kategori ?? '').trim() || 'Lain-lain'
    map.set(k, (map.get(k) ?? 0) + (it.total ?? 0))
  }
  return [...map.entries()].map(([label, jumlah]) => ({ label, jumlah })).sort((a, b) => a.label.localeCompare(b.label))
}

function formatTanggalLabel(d?: Date | null) {
  if (!d) return null
  // output tidak perlu super formal dulu, bisa kamu adjust belakangan
  // contoh: 05 Januari 2026
  const bulan = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ]
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = bulan[d.getMonth()]
  const yy = d.getFullYear()
  return `${dd} ${mm} ${yy}`
}

function pickSigner(signers: Array<any>, order: number) {
  const s = signers.find((x) => x.order === order)
  if (!s) return null
  return { nama: s.nama, nip: s.nip ?? null }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: spjId } = await ctx.params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const guard = await ensureOwner(spjId, session.user.id, session.user.role as string)
  if (!guard.ok) return NextResponse.json({ message: 'Forbidden' }, { status: guard.status })

  // ambil SPJ + roster + rincian + kuitansi + signers
  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    include: {
      roster: { orderBy: [{ role: 'asc' }, { order: 'asc' }] },
      rincian: true,
      kuitansi: true,
      signers: {
        where: { docType: 'KUITANSI' as SpjDocType },
        orderBy: [{ order: 'asc' }]
      }
    }
  })

  if (!spj) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const rosterSorted = [...(spj.roster ?? [])].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'KEPALA_JALAN' ? -1 : 1
    return a.order - b.order
  })
  const kepala = rosterSorted.find((r) => r.role === 'KEPALA_JALAN') ?? rosterSorted[0]
  const penerima = {
    nama: kepala?.nama ?? '',
    nip: kepala?.nip ?? null
  }

  const rincianKategori = groupKategori((spj.rincian ?? []).map((x) => ({ kategori: x.kategori, total: x.total })))

  const doc = (
    <KuitansiPdf
      spj={{
        tahunAnggaran: spj.tahunAnggaran ?? '2025',
        kodeKegiatan: spj.kodeKegiatan ?? null,
        judulKegiatan: spj.judulKegiatan ?? null,
        kodeSubKegiatan: spj.kodeSubKegiatan ?? null,
        judulSubKegiatan: spj.judulSubKegiatan ?? null,
        upGu: spj.upGu ?? null,
        nomorBku: spj.nomorBku ?? null,
        kodeRekening: spj.kodeRekening ?? null,
        judulRekening: spj.judulRekening ?? null,
        maksudDinas: spj.maksudDinas ?? '',
        kotaTandaTangan: spj.kotaTandaTangan ?? 'Sendawar',
        tanggalKuitansiLabel: formatTanggalLabel(spj.kuitansi?.tanggalKuitansi ?? null)
      }}
      penerima={penerima}
      rincian={rincianKategori}
      signers={{
        kpa: pickSigner(spj.signers ?? [], 1),
        bpp: pickSigner(spj.signers ?? [], 2)
      }}
    />
  )

  const stream = await renderToStream(doc)

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="kuitansi-${spjId}.pdf"`
    }
  })
}
