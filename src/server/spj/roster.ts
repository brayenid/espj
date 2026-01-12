import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { getSpjDetailForCurrentUser } from '@/server/spj/queries'

export async function getRoster(spjId: string) {
  const access = await getSpjDetailForCurrentUser(spjId)
  if (access.status !== 'OK') return access

  const items = await prisma.spjRosterItem.findMany({
    where: { spjId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      order: true,
      role: true,
      nama: true,
      nip: true,
      jabatan: true,
      golongan: true,
      pangkat: true
    }
  })

  return { status: 'OK' as const, spj: access.spj, items }
}

export async function addRosterItem(spjId: string, pegawaiId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // ownership guard
  const access = await getSpjDetailForCurrentUser(spjId)
  if (access.status !== 'OK') return access

  const pegawai = await prisma.pegawai.findUnique({ where: { id: pegawaiId } })
  if (!pegawai) return { status: 'NOT_FOUND' as const }

  const last = await prisma.spjRosterItem.findFirst({
    where: { spjId },
    orderBy: { order: 'desc' },
    select: { order: true }
  })
  const nextOrder = (last?.order ?? 0) + 1

  // jika ini orang pertama, jadikan kepala jalan
  const count = await prisma.spjRosterItem.count({ where: { spjId } })
  const role = count === 0 ? 'KEPALA_JALAN' : 'PENGIKUT'

  await prisma.spjRosterItem.create({
    data: {
      spjId,
      pegawaiId,
      order: nextOrder,
      role,

      // snapshot
      nama: pegawai.nama,
      nip: pegawai.nip,
      jabatan: pegawai.jabatan,
      golongan: pegawai.golongan,
      pangkat: pegawai.pangkat,
      instansi: pegawai.instansi
    }
  })

  return { status: 'OK' as const }
}

export async function setKepalaJalan(spjId: string, rosterItemId: string) {
  const access = await getSpjDetailForCurrentUser(spjId)
  if (access.status !== 'OK') return access

  // set semua jadi pengikut, lalu satu jadi kepala
  await prisma.$transaction([
    prisma.spjRosterItem.updateMany({
      where: { spjId },
      data: { role: 'PENGIKUT' }
    }),
    prisma.spjRosterItem.update({
      where: { id: rosterItemId },
      data: { role: 'KEPALA_JALAN' }
    })
  ])

  return { status: 'OK' as const }
}

export async function removeRosterItem(spjId: string, rosterItemId: string) {
  const access = await getSpjDetailForCurrentUser(spjId)
  if (access.status !== 'OK') return access

  await prisma.spjRosterItem.delete({ where: { id: rosterItemId } })

  // re-order biar rapih (opsional tapi bagus)
  const items = await prisma.spjRosterItem.findMany({
    where: { spjId },
    orderBy: { order: 'asc' },
    select: { id: true }
  })

  await prisma.$transaction(
    items.map((it, idx) =>
      prisma.spjRosterItem.update({
        where: { id: it.id },
        data: { order: idx + 1 }
      })
    )
  )

  // kalau kepala jalan terhapus, set pertama jadi kepala
  const hasKepala = await prisma.spjRosterItem.count({
    where: { spjId, role: 'KEPALA_JALAN' }
  })
  if (!hasKepala) {
    const first = await prisma.spjRosterItem.findFirst({
      where: { spjId },
      orderBy: { order: 'asc' },
      select: { id: true }
    })
    if (first) {
      await prisma.spjRosterItem.update({
        where: { id: first.id },
        data: { role: 'KEPALA_JALAN' }
      })
    }
  }

  return { status: 'OK' as const }
}
