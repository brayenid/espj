import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// QA: Schema harus menangani input tanggal dalam format ISO string dari client
const schema = z
  .object({
    noTelaahan: z.string().trim().nullable().optional(),
    noSuratTugas: z.string().trim().nullable().optional(),
    noSpd: z.string().trim().nullable().optional(),
    tahunAnggaran: z.string().trim().nullable().optional(),
    kodeKegiatan: z.string().trim().nullable().optional(),
    judulKegiatan: z.string().trim().nullable().optional(),
    kodeSubKegiatan: z.string().trim().nullable().optional(),
    judulSubKegiatan: z.string().trim().nullable().optional(),
    upGu: z.string().trim().nullable().optional(),
    nomorBku: z.string().trim().nullable().optional(),
    kodeRekening: z.string().trim().nullable().optional(),
    judulRekening: z.string().trim().nullable().optional(),
    akunAnggaran: z.string().trim().nullable().optional(),
    buktiDukungUrl: z.string().trim().nullable().optional(),
    maksudDinas: z.string().trim().nullable().optional(),
    tingkatPerjalanan: z.string().trim().nullable().optional(),
    tempatTujuan: z.string(),
    // Tambahkan field tanggal dengan pre-processing ke objek Date
    tglBerangkat: z.preprocess((val) => new Date(val as string), z.date()),
    tglKembali: z.preprocess((val) => new Date(val as string), z.date())
  })
  .refine((data) => data.tglKembali >= data.tglBerangkat, {
    message: 'Tanggal kembali tidak boleh kurang dari tanggal berangkat',
    path: ['tglKembali']
  })

// Helper untuk menghitung selisih hari secara inklusif (sama dengan logika draf)
function calculateDuration(start: Date, end: Date) {
  const dStart = new Date(start)
  const dEnd = new Date(end)
  dStart.setHours(0, 0, 0, 0)
  dEnd.setHours(0, 0, 0, 0)

  const diffInMs = dEnd.getTime() - dStart.getTime()
  return Math.round(diffInMs / (1000 * 60 * 60 * 24)) + 1
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: spjId } = await ctx.params
    if (!spjId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const json = await req.json().catch(() => null)
    const parsed = schema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Hitung lama perjalanan berdasarkan input tanggal terbaru
    const duration = calculateDuration(data.tglBerangkat, data.tglKembali)

    await prisma.spj.update({
      where: { id: spjId },
      data: {
        noTelaahan: data.noTelaahan,
        noSuratTugas: data.noSuratTugas,
        noSpd: data.noSpd,
        tahunAnggaran: data.tahunAnggaran,
        kodeKegiatan: data.kodeKegiatan,
        judulKegiatan: data.judulKegiatan,
        kodeSubKegiatan: data.kodeSubKegiatan,
        judulSubKegiatan: data.judulSubKegiatan,
        upGu: data.upGu,
        nomorBku: data.nomorBku,
        kodeRekening: data.kodeRekening,
        judulRekening: data.judulRekening,
        akunAnggaran: data.akunAnggaran,
        buktiDukungUrl: data.buktiDukungUrl,
        maksudDinas: data.maksudDinas ?? undefined,
        tingkatPerjalanan: data.tingkatPerjalanan,
        tempatTujuan: data.tempatTujuan,
        // Simpan tanggal dan hasil hitung durasi
        tglBerangkat: data.tglBerangkat,
        tglKembali: data.tglKembali,
        lamaPerjalanan: duration
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[META_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
