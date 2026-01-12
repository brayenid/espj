// src/components/spj/spj-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Item = {
  label: string
  href: string
  exact?: boolean
}

export default function SpjNav({ spjId }: { spjId: string }) {
  const pathname = usePathname()

  const items: Item[] = [
    { label: 'Ringkasan', href: `/spj/${spjId}`, exact: true },
    { label: 'Personel', href: `/spj/${spjId}/personel` },
    { label: 'Telaahan', href: `/spj/${spjId}/telaahan` },
    { label: 'DOPD', href: `/spj/${spjId}/dopd` },
    { label: 'Kuitansi', href: `/spj/${spjId}/kuitansi` },
    { label: 'Surat Tugas', href: `/spj/${spjId}/surat-tugas` },
    { label: 'SPD', href: `/spj/${spjId}/spd` },
    { label: 'Visum', href: `/spj/${spjId}/visum` },
    { label: 'Laporan', href: `/spj/${spjId}/laporan` }
  ]

  function isActive(it: Item) {
    if (it.exact) return pathname === it.href
    return pathname === it.href || pathname.startsWith(`${it.href}/`)
  }

  return (
    <div className="mt-2">
      {/* Outer shell (Linear-ish) */}
      <div className="rounded-2xl border border-border/60 bg-background/40 p-1">
        {/* Scroll row */}
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((it) => {
            const active = isActive(it)
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  'inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                )}>
                {it.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
