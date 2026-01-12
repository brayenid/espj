import { notFound } from 'next/navigation'
import { getRoster } from '@/server/spj/roster'
import ForbiddenCard from '@/components/shared/forbidden'
import PersonelRoster from '@/components/spj/personel-roster'

export default async function PersonelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const result = await getRoster(id)
  if (result.status === 'NOT_FOUND') notFound()
  if (result.status === 'FORBIDDEN') return <ForbiddenCard />
  if (result.status !== 'OK') notFound()

  return <PersonelRoster spjId={id} items={result.items} />
}
