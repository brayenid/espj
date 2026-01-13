import { prisma } from '@/lib/prisma'
import { getSpjDetailForCurrentUser } from '@/server/spj/queries'
import { z } from 'zod'

// QA: Tambahkan tglTelaahan ke schema agar sinkron dengan Client Form
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
  // Menerima string (ISO dari client) dan mengubahnya menjadi Date object
  tglTelaahan: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg)
  }, z.date().optional().nullable())
})

export type TelaahanInput = z.infer<typeof telaahanSchema>

export async function getTelaahanForCurrentUser(spjId: string) {
  const access = await getSpjDetailForCurrentUser(spjId)
  if (access.status !== 'OK') return access

  const [telaahan, roster] = await Promise.all([
    prisma.spjTelaahanStaf.findUnique({
      where: { spjId },
      select: {
        id: true,
        kepada: true,
        sifat: true,
        lampiran: true,
        perihal: true,
        dasar: true,
        praAnggapan: true,
        fakta: true,
        analisis: true,
        kesimpulan: true,
        saran: true,
        tglTelaahan: true // Ambil field tanggal dari DB
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
      tglTelaahan: data.tglTelaahan ?? new Date(), // Simpan tanggal
      kepada: data.kepada ?? 'Bupati Kutai Barat',
      sifat: data.sifat ?? 'Penting',
      lampiran: data.lampiran ?? '-',
      perihal: data.perihal,
      dasar: data.dasar ?? null,
      praAnggapan: data.praAnggapan,
      fakta: data.fakta,
      analisis: data.analisis ?? null,
      kesimpulan: data.kesimpulan ?? null,
      saran: data.saran ?? null
    },
    update: {
      tglTelaahan: data.tglTelaahan ?? new Date(), // Update tanggal
      kepada: data.kepada ?? null,
      sifat: data.sifat ?? null,
      lampiran: data.lampiran ?? null,
      perihal: data.perihal,
      dasar: data.dasar ?? null,
      praAnggapan: data.praAnggapan,
      fakta: data.fakta,
      analisis: data.analisis ?? null,
      kesimpulan: data.kesimpulan ?? null,
      saran: data.saran ?? null
    },
    select: { id: true }
  })

  return { status: 'OK' as const, id: saved.id }
}
