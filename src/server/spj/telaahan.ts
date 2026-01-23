import { prisma } from '@/lib/prisma'
import { getSpjDetailForCurrentUser } from '@/server/spj/queries'
import { z } from 'zod'

export const telaahanSchema = z.object({
  kepada: z.string().optional().nullable(),
  sifat: z.string().optional().nullable(),
  lampiran: z.string().optional().nullable(),
  perihal: z.string().min(3, 'Perihal wajib diisi'),
  dasar: z.string().optional().nullable(),
  praAnggapan: z.array(z.string().min(1)).default([]),
  fakta: z.array(z.string().min(1)).default([]),
  analisis: z.string().optional().nullable(),
  kesimpulan: z.string().optional().nullable(),
  saran: z.string().optional().nullable(),
  tglTelaahan: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg)
  }, z.date().optional().nullable()),

  // Penyesuaian Signer
  signerPegawaiId: z.string().optional().nullable(),
  signerNama: z.string().optional().nullable(),
  signerNip: z.string().optional().nullable(),
  signerJabatan: z.string().optional().nullable(),
  signerPangkat: z.string().optional().nullable(),
  signerGolongan: z.string().optional().nullable(),
  signerJabatanTampil: z.string().optional().nullable()
})

export type TelaahanInput = z.infer<typeof telaahanSchema>

export async function getTelaahanForCurrentUser(spjId: string) {
  const access = await getSpjDetailForCurrentUser(spjId)
  if (access.status !== 'OK') return access

  const [telaahan, roster] = await Promise.all([
    prisma.spjTelaahanStaf.findUnique({
      where: { spjId }
    }),
    prisma.spjRosterItem.findMany({
      where: { spjId },
      orderBy: { order: 'asc' }
    })
  ])

  return { status: 'OK' as const, spj: access.spj, telaahan, roster }
}

export async function upsertTelaahanForCurrentUser(spjId: string, input: unknown) {
  const access = await getSpjDetailForCurrentUser(spjId)
  if (access.status !== 'OK') return access

  const parsed = telaahanSchema.safeParse(input)
  if (!parsed.success) {
    return { status: 'VALIDATION_ERROR' as const, issues: parsed.error.issues }
  }

  const data = parsed.data

  const saved = await prisma.spjTelaahanStaf.upsert({
    where: { spjId },
    create: {
      spjId,
      tglTelaahan: data.tglTelaahan ?? new Date(),
      kepada: data.kepada ?? 'Bupati Kutai Barat',
      sifat: data.sifat ?? 'Penting',
      lampiran: data.lampiran ?? '-',
      perihal: data.perihal,
      dasar: data.dasar,
      praAnggapan: data.praAnggapan,
      fakta: data.fakta,
      analisis: data.analisis,
      kesimpulan: data.kesimpulan,
      saran: data.saran,
      // Signer Snapshot
      signerPegawaiId: data.signerPegawaiId,
      signerNama: data.signerNama,
      signerNip: data.signerNip,
      signerJabatan: data.signerJabatan,
      signerPangkat: data.signerPangkat,
      signerGolongan: data.signerGolongan,
      signerJabatanTampil: data.signerJabatanTampil
    },
    update: {
      tglTelaahan: data.tglTelaahan ?? new Date(),
      kepada: data.kepada,
      sifat: data.sifat,
      lampiran: data.lampiran,
      perihal: data.perihal,
      dasar: data.dasar,
      praAnggapan: data.praAnggapan,
      fakta: data.fakta,
      analisis: data.analisis,
      kesimpulan: data.kesimpulan,
      saran: data.saran,
      // Signer Update
      signerPegawaiId: data.signerPegawaiId,
      signerNama: data.signerNama,
      signerNip: data.signerNip,
      signerJabatan: data.signerJabatan,
      signerPangkat: data.signerPangkat,
      signerGolongan: data.signerGolongan,
      signerJabatanTampil: data.signerJabatanTampil
    },
    select: { id: true }
  })

  return { status: 'OK' as const, id: saved.id }
}
