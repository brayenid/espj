'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

export default function SpjSearchBar({ initialQ }: { initialQ?: string }) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ ?? '')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = q.trim()
    const params = new URLSearchParams()
    if (value) params.set('q', value)
    params.set('page', '1')
    const qs = params.toString()
    router.push(qs ? `/spj?${qs}` : '/spj')
  }

  return (
    <form onSubmit={onSubmit} className="relative group flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari berdasarkan tujuan, nomor surat, nama pelaksana..."
          className="pl-9 h-9 border-border/50 bg-background/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 rounded-md"
        />
        {q && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
            onClick={() => {
              setQ('')
              router.push('/spj')
            }}>
            <X className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        className="h-9 px-4 border border-border/50 rounded-md cursor-pointer">
        Cari
      </Button>
    </form>
  )
}
