// src/app/(dashboard)/spj/[id]/layout.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSpjDetailForCurrentUser } from '@/server/spj/queries'
import ForbiddenCard from '@/components/shared/forbidden'
import SpjNav from '@/components/spj/spj-nav'
import { Home, MapPin, ChevronLeft, ArrowRight } from 'lucide-react'

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
    <div className="mx-auto w-full max-w-7xl p-2 space-y-4">
      {/* Header Info - Non Sticky */}
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/spj"
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
              Dokumen Perjalanan Dinas
            </div>
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-primary" /> {spj.tempatBerangkat}
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" /> {spj.tempatTujuan}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigasi Sticky */}
      <div className="sticky top-14 z-40 pt-2 pb-1 bg-background/60 backdrop-blur-md">
        <SpjNav spjId={spj.id} />
      </div>

      {/* Content Area */}
      <div className="px-1 pt-2">{children}</div>
    </div>
  )
}
