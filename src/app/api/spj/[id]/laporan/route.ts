import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { LaporanHasilMode } from '@prisma/client'

const Schema = z.object({
  dasarLaporan: z.string().nullable().optional(),
  kegiatan: z.string().nullable().optional(),
  waktu: z.string().nullable().optional(),
  lokasi: z.string().nullable().optional(),
  tujuan: z.string().nullable().optional(),

  signerPegawaiId: z.string().nullable().optional(),
  signerJabatanTampil: z.string().nullable().optional(),

  hasilMode: z.enum(['POINTS', 'NARASI']),
  hasilPembuka: z.string().nullable().optional(),
  hasilPoin: z.array(z.string()).optional().default([]),
  hasilNarasi: z.string().nullable().optional()
})

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

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
  const v = parsed.data

  // ===== resolve signer snapshot (optional)
  let signerSnap = {
    signerPegawaiId: null as string | null,
    signerNama: null as string | null,
    signerNip: null as string | null,
    signerJabatan: null as string | null,
    signerPangkat: null as string | null,
    signerGolongan: null as string | null
  }

  if (v.signerPegawaiId) {
    const p = await prisma.pegawai.findUnique({
      where: { id: v.signerPegawaiId },
      select: { id: true, nama: true, nip: true, jabatan: true, pangkat: true, golongan: true }
    })
    if (p) {
      signerSnap = {
        signerPegawaiId: p.id,
        signerNama: p.nama,
        signerNip: p.nip ?? null,
        signerJabatan: p.jabatan ?? null,
        signerPangkat: p.pangkat ?? null,
        signerGolongan: p.golongan ?? null
      }
    }
  }

  // ===== normalize hasil fields
  const hasilPoin = v.hasilMode === 'POINTS' ? (v.hasilPoin ?? []).map((x) => x.trim()).filter(Boolean) : []
  const hasilNarasi = v.hasilMode === 'NARASI' ? v.hasilNarasi ?? null : null

  const saved = await prisma.spjLaporan.upsert({
    where: { spjId },
    create: {
      spjId,
      dasarLaporan: v.dasarLaporan ?? null,
      kegiatan: v.kegiatan ?? null,
      waktu: v.waktu ?? null,
      lokasi: v.lokasi ?? null,
      tujuan: v.tujuan ?? null,

      ...signerSnap,
      signerJabatanTampil: v.signerJabatanTampil ?? null,

      hasilMode: v.hasilMode as LaporanHasilMode,
      hasilPembuka: v.hasilPembuka ?? null,
      hasilPoin,
      hasilNarasi
    },
    update: {
      dasarLaporan: v.dasarLaporan ?? null,
      kegiatan: v.kegiatan ?? null,
      waktu: v.waktu ?? null,
      lokasi: v.lokasi ?? null,
      tujuan: v.tujuan ?? null,

      ...signerSnap,
      signerJabatanTampil: v.signerJabatanTampil ?? null,

      hasilMode: v.hasilMode as LaporanHasilMode,
      hasilPembuka: v.hasilPembuka ?? null,
      hasilPoin,
      hasilNarasi
    }
  })

  return NextResponse.json({ laporan: saved }, { status: 200 })
}
