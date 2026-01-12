import { notFound } from 'next/navigation'
import ForbiddenCard from '@/components/shared/forbidden'
import { getTelaahanForCurrentUser } from '@/server/spj/telaahan'
import TelaahanForm from '@/components/spj/telaahan-form'

export default async function TelaahanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const result = await getTelaahanForCurrentUser(id)
  if (result.status === 'NOT_FOUND') notFound()
  if (result.status === 'FORBIDDEN') return <ForbiddenCard />
  if (result.status !== 'OK') notFound()

  return <TelaahanForm spjId={id} initial={result.telaahan} initialSpj={result.spj} roster={result.roster} />
}
