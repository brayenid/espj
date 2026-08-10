import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Validasi Autentikasi Session
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Ambil data master Pegawai & User (tanpa password hash)
    const pegawais = await prisma.pegawai.findMany({
      orderBy: { nama: 'asc' }
    })

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true
      }
    })

    // 3. Ambil data SPJ lengkap dengan seluruh relasi dokumen pendukung dan DOPD
    const spjs = await prisma.spj.findMany({
      include: {
        roster: {
          orderBy: { order: 'asc' }
        },
        rincian: {
          include: {
            factors: {
              orderBy: { order: 'asc' }
            }
          }
        },
        signers: true,
        telaahan: true,
        visum: true,
        kuitansi: true,
        laporan: true,
        spjSuratTugas: true
      },
      orderBy: { tglBerangkat: 'desc' }
    })

    // 4. Return format JSON terstruktur untuk migrasi
    return NextResponse.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      metadata: {
        totalSpj: spjs.length,
        totalPegawai: pegawais.length,
        totalUser: users.length
      },
      users,
      pegawais,
      spjs
    })
  } catch (error: any) {
    console.error('[EXPORT_JSON_ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal mengekspor data', details: error.message || error },
      { status: 500 }
    )
  }
}
