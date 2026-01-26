'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUpDown } from 'lucide-react'

export default function SpjSortSelect({ currentSort }: { currentSort: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onSortChange = (value: string) => {
    // Pertahankan parameter 'q' (pencarian) yang sudah ada
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)

    // Reset ke halaman 1 saat sorting berubah agar user tidak bingung
    params.set('page', '1')

    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 w-full shadow-none">
      <Select value={currentSort} onValueChange={onSortChange}>
        <SelectTrigger className="h-10 w-full bg-background border-border/60 shadow-none">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <SelectValue placeholder="Urutkan" />
          </div>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="departure_desc">Keberangkatan (Terbaru)</SelectItem>
          <SelectItem value="departure_asc">Keberangkatan (Terlama)</SelectItem>
          <SelectItem value="created_desc">Dibuat (Terbaru)</SelectItem>
          <SelectItem value="created_asc">Dibuat (Terlama)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
