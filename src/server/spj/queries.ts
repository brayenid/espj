import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { Prisma } from '@prisma/client'

// 1. Tambahkan properti sort pada interface opsi
export async function listSpjForCurrentUser(options?: { q?: string; skip?: number; take?: number; sort?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const role = session.user.role
  const userId = session.user.id
  // 2. Destructure sort dari options
  const { q, skip, take, sort } = options ?? {}

  // Filter dasar berdasarkan kepemilikan data & Role
  const baseWhere: Prisma.SpjWhereInput = role === 'SUPER_ADMIN' ? {} : { createdById: userId }

  // Konstruksi Search Filter
  let searchWhere: Prisma.SpjWhereInput = {}

  if (q) {
    const searchConditions: Prisma.SpjWhereInput[] = [
      { tempatTujuan: { contains: q, mode: 'insensitive' } },
      { noSuratTugas: { contains: q, mode: 'insensitive' } },
      { noSpd: { contains: q, mode: 'insensitive' } },
      { noTelaahan: { contains: q, mode: 'insensitive' } },
      {
        roster: {
          some: {
            nama: { contains: q, mode: 'insensitive' }
          }
        }
      }
    ]

    // SEARCH BERDASARKAN TANGGAL
    if (/^\d{4}$/.test(q)) {
      const year = parseInt(q)
      searchConditions.push({
        tglBerangkat: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        }
      })
    } else if (/^\d{4}-\d{2}$/.test(q)) {
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

  // 3. Tentukan logika orderBy berdasarkan parameter sort
  let orderBy: Prisma.SpjOrderByWithRelationInput = { tglBerangkat: 'desc' } // Default yang masuk akal

  switch (sort) {
    case 'departure_desc':
      orderBy = { tglBerangkat: 'desc' }
      break
    case 'departure_asc':
      orderBy = { tglBerangkat: 'asc' }
      break
    case 'created_desc':
      orderBy = { createdAt: 'desc' }
      break
    case 'created_asc':
      orderBy = { createdAt: 'asc' }
      break
    default:
      // Default fallback jika sort tidak dikenali
      orderBy = { tglBerangkat: 'desc' }
  }

  // Eksekusi Query
  const [items, total] = await Promise.all([
    prisma.spj.findMany({
      where,
      skip,
      take,
      // 4. Gunakan variabel orderBy yang dinamis
      orderBy,
      include: {
        roster: {
          orderBy: { order: 'asc' },
          select: {
            nama: true,
            role: true
          }
        },
        telaahan: true,
        spjSuratTugas: true,
        visum: true,
        kuitansi: true,
        laporan: true,
        rincian: true
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
