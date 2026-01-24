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
    <nav className="w-full">
      <div className="relative rounded-2xl border border-border/50 bg-muted/30 p-1.5 overflow-hidden">
        {/* Kontainer Scrollable */}
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {items.map((it) => {
            const active = isActive(it)
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  'relative inline-flex h-9 items-center justify-center rounded-xl px-4 text-[13px] font-bold transition-all duration-200',
                  active
                    ? 'bg-background text-primary ring-1 ring-border/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                )}>
                {it.label}
                {/* Underline aktif minimalis */}
                {active && <span className="absolute bottom-1 w-6 h-1 rounded-full bg-slate-400" />}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
