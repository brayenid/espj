// src/app/(dashboard)/spj/[id]/layout.tsx
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
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mt-1 text-sm text-muted-foreground">
              {spj.tempatBerangkat} → {spj.tempatTujuan}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <Link
              href="/spj"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Kembali ke daftar
            </Link>
          </div>
        </div>

        {/* ✅ modern nav */}
        <SpjNav spjId={spj.id} />
      </div>

      {children}
    </div>
  )
}
