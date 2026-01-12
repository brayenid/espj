// src/app/api/spj/[id]/meta/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
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
  tingkatPerjalanan: z.optional(z.string().trim().nullable())
})

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const spjId = await (await ctx.params).id
  if (!spjId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const json = await req.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  await prisma.spj.update({
    where: { id: spjId },
    data: {
      noTelaahan: data.noTelaahan ?? undefined,
      noSuratTugas: data.noSuratTugas ?? undefined,
      noSpd: data.noSpd ?? undefined,

      tahunAnggaran: data.tahunAnggaran ?? undefined,
      kodeKegiatan: data.kodeKegiatan ?? undefined,
      judulKegiatan: data.judulKegiatan ?? undefined,
      kodeSubKegiatan: data.kodeSubKegiatan ?? undefined,
      judulSubKegiatan: data.judulSubKegiatan ?? undefined,
      upGu: data.upGu ?? undefined,
      nomorBku: data.nomorBku ?? undefined,
      kodeRekening: data.kodeRekening ?? undefined,
      judulRekening: data.judulRekening ?? undefined,
      akunAnggaran: data.akunAnggaran ?? undefined,

      buktiDukungUrl: data.buktiDukungUrl ?? undefined,
      maksudDinas: data.maksudDinas ?? undefined,
      tingkatPerjalanan: data.tingkatPerjalanan ?? undefined
    }
  })

  return NextResponse.json({ ok: true })
}
