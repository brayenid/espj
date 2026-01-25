import { z } from 'zod'

export const createSpjDraftSchema = z.object({
  id: z.string(),
  tempatTujuan: z.string().min(2, 'Tujuan wajib diisi'),
  maksudDinas: z.string().min(5, 'Maksud dinas wajib diisi'),
  alatAngkut: z.string().min(2).optional(),
  tempatBerangkat: z.string().min(2).optional(),
  kotaTandaTangan: z.string().min(2).optional(),
  tglBerangkat: z.string().min(8),
  tglKembali: z.string().min(8),
  tglSuratTugas: z.string().min(8).optional(),
  tglSpd: z.string().min(8).optional(),
  noSuratTugas: z.string().optional(),
  noSpd: z.string().optional(),
  noTelaahan: z.string().optional()
})
