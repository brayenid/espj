import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function listSpjForCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const role = session.user.role
  const userId = session.user.id

  return prisma.spj.findMany({
    where: role === 'SUPER_ADMIN' ? {} : { createdById: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      tempatTujuan: true,
      tglBerangkat: true,
      tglKembali: true,
      noSuratTugas: true,
      noSpd: true,
      noTelaahan: true
    }
  })
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

      buktiDukungUrl: true
    }
  })

  if (!spj) return { status: 'NOT_FOUND' as const }

  const canRead = role === 'SUPER_ADMIN' || spj.createdById === userId
  if (!canRead) return { status: 'FORBIDDEN' as const }

  return { status: 'OK' as const, spj }
}
