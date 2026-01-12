import { prisma } from '@/lib/prisma'
import { getSpjDetailForCurrentUser } from '@/server/spj/queries'
import { z } from 'zod'

export const suratTugasSchema = z.object({
  nomor: z.string().optional().nullable(),
  untuk: z.string().min(3, "Kolom 'Untuk' wajib diisi"),
  assignedRosterItemId: z.string().optional().nullable(),
  signerPegawaiId: z.string().optional().nullable()
})

export type SuratTugasInput = z.infer<typeof suratTugasSchema>

export async function getSuratTugasForCurrentUser(spjId: string) {
  const access = await getSpjDetailForCurrentUser(spjId)
  if (access.status !== 'OK') return access

  const [suratTugas, roster, pegawai] = await Promise.all([
    prisma.spjSuratTugas.findUnique({
      where: { spjId },
      select: {
        id: true,
        nomor: true,
        untuk: true,
        assignedRosterItemId: true,
        signerPegawaiId: true,
        signerNama: true,
        signerNip: true,
        signerJabatan: true,
        signerPangkatGolongan: true
      }
    }),
    prisma.spjRosterItem.findMany({
      where: { spjId },
      orderBy: { order: 'asc' },
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
    prisma.pegawai.findMany({
      orderBy: { nama: 'asc' },
      select: {
        id: true,
        nama: true,
        nip: true,
        jabatan: true,
        pangkat: true,
        golongan: true
      }
    })
  ])

  return { status: 'OK' as const, spj: access.spj, suratTugas, roster, pegawai }
}

function fmtPangkatGol(pangkat: string | null, golongan: string | null) {
  const p = (pangkat ?? '').trim()
  const g = (golongan ?? '').trim()
  if (p && /\([^)]+\)/.test(p)) return p
  if (p && !g) return p
  if (p && g) return `${p} (${g})`
  if (!p && g) return g
  return null
}

export async function upsertSuratTugasForCurrentUser(spjId: string, input: unknown) {
  const access = await getSpjDetailForCurrentUser(spjId)
  if (access.status !== 'OK') return access

  const parsed = suratTugasSchema.safeParse(input)
  if (!parsed.success) {
    return { status: 'VALIDATION_ERROR' as const, issues: parsed.error.issues }
  }

  const data = parsed.data

  // Pastikan roster item valid (kalau diisi)
  if (data.assignedRosterItemId) {
    const rosterOk = await prisma.spjRosterItem.findFirst({
      where: { id: data.assignedRosterItemId, spjId },
      select: { id: true }
    })
    if (!rosterOk) {
      return {
        status: 'VALIDATION_ERROR' as const,
        issues: [{ code: 'custom', path: ['assignedRosterItemId'], message: 'Roster tidak valid.' }]
      }
    }
  }

  // Signer snapshot (kalau dipilih)
  let signerSnapshot: {
    signerPegawaiId: string | null
    signerNama: string
    signerNip: string | null
    signerJabatan: string
    signerPangkatGolongan: string | null
  } | null = null

  if (data.signerPegawaiId) {
    const p = await prisma.pegawai.findUnique({
      where: { id: data.signerPegawaiId },
      select: { id: true, nama: true, nip: true, jabatan: true, pangkat: true, golongan: true }
    })
    if (!p) {
      return {
        status: 'VALIDATION_ERROR' as const,
        issues: [{ code: 'custom', path: ['signerPegawaiId'], message: 'Pegawai penandatangan tidak ditemukan.' }]
      }
    }
    signerSnapshot = {
      signerPegawaiId: p.id,
      signerNama: p.nama,
      signerNip: p.nip ?? null,
      signerJabatan: p.jabatan,
      signerPangkatGolongan: fmtPangkatGol(p.pangkat ?? null, p.golongan ?? null)
    }
  }

  // Default “untuk” kalau dokumen belum ada: ambil dari maksudDinas (lebih masuk akal daripada perihal)
  const defaultUntuk = access.spj.maksudDinas

  const saved = await prisma.spjSuratTugas.upsert({
    where: { spjId },
    create: {
      spjId,
      nomor: data.nomor ?? null,
      untuk: data.untuk || defaultUntuk,
      assignedRosterItemId: data.assignedRosterItemId ?? null,

      signerPegawaiId: signerSnapshot?.signerPegawaiId ?? null,
      signerNama: signerSnapshot?.signerNama ?? '-',
      signerNip: signerSnapshot?.signerNip ?? null,
      signerJabatan: signerSnapshot?.signerJabatan ?? '-',
      signerPangkatGolongan: signerSnapshot?.signerPangkatGolongan ?? null
    },
    update: {
      nomor: data.nomor ?? null,
      untuk: data.untuk,
      assignedRosterItemId: data.assignedRosterItemId ?? null,

      ...(signerSnapshot
        ? {
            signerPegawaiId: signerSnapshot.signerPegawaiId,
            signerNama: signerSnapshot.signerNama,
            signerNip: signerSnapshot.signerNip,
            signerJabatan: signerSnapshot.signerJabatan,
            signerPangkatGolongan: signerSnapshot.signerPangkatGolongan
          }
        : {})
    },
    select: { id: true }
  })

  return { status: 'OK' as const, id: saved.id }
}
