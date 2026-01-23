import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSpjDetailForCurrentUser } from '@/server/spj/queries'
import ForbiddenCard from '@/components/shared/forbidden'
import SpjNav from '@/components/spj/spj-nav'
import { Home, MapPin } from 'lucide-react'

export default async function SpjLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const result = await getSpjDetailForCurrentUser(id)
  if (result.status === 'NOT_FOUND') notFound()
  if (result.status === 'FORBIDDEN') return <ForbiddenCard />

  const spj = result.status === 'OK' ? result.spj : null
  if (!spj) notFound()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-2">
      <div className="space-y-3">
        <div className="flex flex-row gap-4 flex-wrap items-start justify-between">
          <div className="text-sm uppercase tracking-wider font-semibold flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" /> {spj.tempatBerangkat}
            </div>{' '}
            →{' '}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {spj.tempatTujuan}
            </div>
          </div>

          <Link href="/spj" className="text-sm font-semibold hover:text-foreground hover:underline">
            Kembali
          </Link>
        </div>

        <SpjNav spjId={spj.id} />
      </div>

      {children}
    </div>
  )
}
