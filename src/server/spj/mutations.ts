import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { z } from 'zod'

export const createSpjDraftSchema = z.object({
  tempatTujuan: z.string().min(2, 'Tujuan wajib diisi'),
  maksudDinas: z.string().min(5, 'Maksud dinas wajib diisi'),

  alatAngkut: z.string().min(2).optional(),
  tempatBerangkat: z.string().min(2).optional(),
  kotaTandaTangan: z.string().min(2).optional(),

  tglBerangkat: z.string().min(8),
  tglKembali: z.string().min(8),

  // ✅ tidak wajib lagi (biar bisa diisi manual belakangan)
  // tetap boleh diterima kalau ada client lama yang masih kirim
  tglSuratTugas: z.string().min(8).optional(),
  tglSpd: z.string().min(8).optional(),

  noSuratTugas: z.string().optional(),
  noSpd: z.string().optional(),
  noTelaahan: z.string().optional()
})

function toDate(value: string) {
  // value from <input type="date"> => "YYYY-MM-DD"
  // treat as local date; create Date at 00:00 local
  const [y, m, d] = value.split('-').map((v) => Number(v))
  return new Date(y, m - 1, d)
}

function diffDaysInclusive(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
  return Math.max(days, 1)
}

export async function createSpjDraft(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const parsed = createSpjDraftSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, message: 'Validasi gagal', issues: parsed.error.issues }
  }

  const data = parsed.data

  const tglBerangkat = toDate(data.tglBerangkat)
  const tglKembali = toDate(data.tglKembali)

  // ✅ default tanggal surat tugas & spd ke tglBerangkat kalau belum diisi
  const tglSuratTugas = data.tglSuratTugas ? toDate(data.tglSuratTugas) : tglBerangkat
  const tglSpd = data.tglSpd ? toDate(data.tglSpd) : tglBerangkat

  const spj = await prisma.spj.create({
    data: {
      createdById: session.user.id,

      tempatTujuan: data.tempatTujuan,
      maksudDinas: data.maksudDinas,
      alatAngkut: data.alatAngkut ?? 'Darat',
      tempatBerangkat: data.tempatBerangkat ?? 'Sendawar',
      kotaTandaTangan: data.kotaTandaTangan ?? 'Sendawar',

      tglBerangkat,
      tglKembali,
      lamaPerjalanan: diffDaysInclusive(tglBerangkat, tglKembali),

      // ✅ tidak wajib input lagi, tapi tetap tersimpan valid di DB
      tglSuratTugas,
      tglSpd,

      noSuratTugas: data.noSuratTugas || null,
      noSpd: data.noSpd || null,
      noTelaahan: data.noTelaahan || null
    },
    select: { id: true }
  })

  return { ok: true as const, id: spj.id }
}
