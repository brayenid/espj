import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSpjDetailForCurrentUser } from '@/server/spj/queries'
import SpdForm from '@/components/spj/spd-form'
import ForbiddenCard from '@/components/shared/forbidden'

const SPD_ROLE_KEY = 'PEMBERI_PERINTAH'

export default async function SpdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const access = await getSpjDetailForCurrentUser(id)
  if (access.status === 'NOT_FOUND') notFound()
  if (access.status === 'FORBIDDEN') return <ForbiddenCard />
  if (access.status !== 'OK') notFound()

  const [roster, pegawai, signer] = await Promise.all([
    prisma.spjRosterItem.findMany({
      where: { spjId: id },
      orderBy: [{ role: 'asc' }, { order: 'asc' }],
      select: { id: true, order: true, role: true, nama: true, nip: true, jabatan: true }
    }),
    prisma.pegawai.findMany({
      orderBy: { nama: 'asc' },
      select: { id: true, nama: true, nip: true, jabatan: true }
    }),
    prisma.spjSigner.findFirst({
      where: { spjId: id, docType: 'SPD', order: 1, roleKey: SPD_ROLE_KEY },
      select: { pegawaiId: true }
    })
  ])

  return (
    <SpdForm
      spjId={id}
      initial={{
        noSpd: access.spj.noSpd,
        tglSpd: access.spj.tglSpd,
        kotaTandaTangan: access.spj.kotaTandaTangan,
        signerPegawaiId: signer?.pegawaiId ?? null
      }}
      roster={roster}
      pegawai={pegawai}
    />
  )
}
