import { prisma } from '@/lib/prisma'

export async function searchPegawai(q: string) {
  const query = q.trim()
  if (!query) return []

  return prisma.pegawai.findMany({
    where: {
      OR: [
        { nama: { contains: query, mode: 'insensitive' } },
        { nip: { contains: query, mode: 'insensitive' } },
        { jabatan: { contains: query, mode: 'insensitive' } }
      ]
    },
    orderBy: { nama: 'asc' },
    take: 20,
    select: {
      id: true,
      nama: true,
      nip: true,
      jabatan: true,
      golongan: true,
      pangkat: true,
      instansi: true
    }
  })
}

export async function listPegawai(params: { q?: string }) {
  const q = (params.q ?? '').trim()
  const where = q
    ? {
        OR: [
          { nama: { contains: q, mode: 'insensitive' as const } },
          { nip: { contains: q, mode: 'insensitive' as const } },
          { jabatan: { contains: q, mode: 'insensitive' as const } }
        ]
      }
    : {}

  const items = await prisma.pegawai.findMany({
    where,
    orderBy: { nama: 'asc' }
  })
  return { items }
}
