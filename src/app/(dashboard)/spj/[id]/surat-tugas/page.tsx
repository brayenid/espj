import { notFound } from 'next/navigation'
import ForbiddenCard from '@/components/shared/forbidden'
import { getSuratTugasForCurrentUser } from '@/server/spj/surat-tugas'
import SuratTugasForm from '@/components/spj/surat-tugas-form'

export default async function SuratTugasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const result = await getSuratTugasForCurrentUser(id)
  if (result.status === 'NOT_FOUND') notFound()
  if (result.status === 'FORBIDDEN') return <ForbiddenCard />
  if (result.status !== 'OK') notFound()

  return (
    <SuratTugasForm
      spjId={id}
      spj={result.spj}
      initial={result.suratTugas}
      roster={result.roster}
      pegawai={result.pegawai}
    />
  )
}
