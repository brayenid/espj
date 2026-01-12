import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const spjId = params.id
    if (!spjId) return NextResponse.json({ message: 'Missing spj id' }, { status: 400 })

    const body = (await req.json()) as { buktiDukungUrl?: string | null }
    const raw = typeof body.buktiDukungUrl === 'string' ? body.buktiDukungUrl.trim() : null

    // validasi ringan di server (zod di client sudah)
    const buktiDukungUrl = raw && raw.length ? raw : null
    if (buktiDukungUrl && !/^https?:\/\//i.test(buktiDukungUrl)) {
      return NextResponse.json({ message: 'Invalid URL' }, { status: 400 })
    }

    await prisma.spj.update({
      where: { id: spjId },
      data: { buktiDukungUrl }
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ message: 'Server error', error: String(e) }, { status: 500 })
  }
}
