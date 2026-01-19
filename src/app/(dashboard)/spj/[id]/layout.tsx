import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSpjDetailForCurrentUser } from '@/server/spj/queries'
import ForbiddenCard from '@/components/shared/forbidden'
import SpjNav from '@/components/spj/spj-nav'

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
          <p className="text-sm uppercase tracking-wider font-semibold">
            {spj.tempatBerangkat} → {spj.tempatTujuan}
          </p>

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
