import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { Prisma } from '@prisma/client'

export async function listSpjForCurrentUser(options?: { q?: string; skip?: number; take?: number }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const role = session.user.role
  const userId = session.user.id
  const { q, skip, take } = options ?? {}

  // 1. Filter dasar berdasarkan kepemilikan data & Role
  const baseWhere: Prisma.SpjWhereInput = role === 'SUPER_ADMIN' ? {} : { createdById: userId }

  // 2. Konstruksi Search Filter
  let searchWhere: Prisma.SpjWhereInput = {}

  if (q) {
    const searchConditions: Prisma.SpjWhereInput[] = [
      { tempatTujuan: { contains: q, mode: 'insensitive' } },
      { noSuratTugas: { contains: q, mode: 'insensitive' } },
      { noSpd: { contains: q, mode: 'insensitive' } },
      { noTelaahan: { contains: q, mode: 'insensitive' } },
      // SEARCH BERDASARKAN ROSTER (Nama Pegawai di Roster)
      {
        roster: {
          some: {
            nama: { contains: q, mode: 'insensitive' }
          }
        }
      }
    ]

    // SEARCH BERDASARKAN TANGGAL
    // Jika input '2025' -> cari sepanjang tahun 2025
    if (/^\d{4}$/.test(q)) {
      const year = parseInt(q)
      searchConditions.push({
        tglBerangkat: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        }
      })
    }
    // Jika input '2025-11' -> cari di bulan November 2025
    else if (/^\d{4}-\d{2}$/.test(q)) {
      const [y, m] = q.split('-').map(Number)
      searchConditions.push({
        tglBerangkat: {
          gte: new Date(y, m - 1, 1),
          lte: new Date(y, m, 0, 23, 59, 59)
        }
      })
    }

    searchWhere = { OR: searchConditions }
  }

  const where: Prisma.SpjWhereInput = {
    AND: [baseWhere, searchWhere]
  }

  // 3. Eksekusi Query
  const [items, total] = await Promise.all([
    prisma.spj.findMany({
      where,
      skip,
      take,
      orderBy: { tglBerangkat: 'desc' }, // Urutkan berdasarkan tanggal berangkat terbaru
      include: {
        // Langsung ambil roster untuk preview di tabel agar hemat query
        roster: {
          orderBy: { order: 'asc' },
          select: {
            nama: true,
            role: true
          }
        }
      }
    }),
    prisma.spj.count({ where })
  ])

  return { items, total }
}

export async function getSpjDetailForCurrentUser(spjId: string) {
  const session = await auth()
  if (!session?.user?.id) return { status: 'UNAUTHORIZED' as const }

  const userId = session.user.id
  const role = session.user.role

  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: {
      id: true,
      createdById: true,
      createdAt: true,

      tempatTujuan: true,
      tempatBerangkat: true,
      alatAngkut: true,
      maksudDinas: true,

      tglBerangkat: true,
      tglKembali: true,
      lamaPerjalanan: true,

      kotaTandaTangan: true,
      tglSuratTugas: true,
      tglSpd: true,

      noTelaahan: true,
      noSuratTugas: true,
      noSpd: true,

      tahunAnggaran: true,
      kodeKegiatan: true,
      judulKegiatan: true,
      kodeSubKegiatan: true,
      judulSubKegiatan: true,
      upGu: true,
      nomorBku: true,
      kodeRekening: true,
      judulRekening: true,
      akunAnggaran: true,

      buktiDukungUrl: true,
      telaahan: {
        select: {
          tglTelaahan: true
        }
      }
    }
  })

  if (!spj) return { status: 'NOT_FOUND' as const }

  const canRead = role === 'SUPER_ADMIN' || spj.createdById === userId
  if (!canRead) return { status: 'FORBIDDEN' as const }

  return { status: 'OK' as const, spj }
}
