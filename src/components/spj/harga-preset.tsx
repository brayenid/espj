'use client'

import * as React from 'react'
import { Banknote, Search, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Mengacu pada file JSON hasil konversi Node.js Anda
import daftarBiaya from '@/data/standar-biaya.json'

interface HargaPresetPickerProps {
  onPick: (price: number) => void
}

/**
 * Komponen HargaPresetPicker
 * Fitur Utama:
 * 1. Multi-term Search: Bisa cari "muara lawa uang" tanpa peduli urutan.
 * 2. Touchpad Fix: Menggunakan onWheel dan native scroll wrapper.
 * 3. Performa: Virtualisasi sederhana dengan .slice(0, 100) dan useMemo.
 * 4. UX: De-duplikasi data otomatis agar tidak membingungkan user.
 */
export function HargaPresetPicker({ onPick }: HargaPresetPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Mengolah data: De-duplikasi dan Multi-term Search
  const filteredData = React.useMemo(() => {
    const seen = new Set()
    // Pecah input menjadi kata-kata (terms)
    const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean)

    return daftarBiaya
      .filter((item) => {
        const nameLower = item.name.toLowerCase()
        const descLower = item.description.toLowerCase()
        // Gabungkan semua teks untuk pencarian
        const combinedText = `${nameLower} ${descLower} ${item.price}`.toLowerCase()

        // 1. Logika Anti-Duplikat
        const duplicateKey = `${nameLower}-${descLower}-${item.price}`.replace(/\s+/g, '')
        if (seen.has(duplicateKey)) return false
        seen.add(duplicateKey)

        // 2. Logika Multi-term: Semua kata yang diketik harus ada di dalam teks barang
        if (searchTerms.length === 0) return true
        return searchTerms.every((term) => combinedText.includes(term))
      })
      .slice(0, 100) // Batasi jumlah item yang dirender agar scroll tetap ringan
  }, [search])

  // Reset scroll ke atas setiap kali user mengetik
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [search])

  // Fix untuk touchpad gesture 2 jari
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop += e.deltaY
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 text-[10px] font-bold rounded-lg px-3 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all shadow-none',
            open && 'ring-2 ring-primary/20 bg-primary/10'
          )}>
          <Banknote className="w-3.5 h-3.5 mr-1.5" />
          PRESET SBU
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-105 p-0 shadow-2xl border-border/40 overflow-hidden"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()} // Mencegah lompatan scroll saat terbuka
        onInteractOutside={(e) => {
          // Mencegah penutupan tidak sengaja saat scroll touchpad di pinggir area
          if (e.target instanceof Element && e.target.closest('.scroll-container')) {
            e.preventDefault()
          }
        }}>
        <Command shouldFilter={false} className="flex flex-col h-full bg-popover">
          {/* Bagian Input Search */}
          <div className="flex items-center border-b px-3 border-border/40 bg-muted/5">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="Contoh: Muara Lawa, Abit"
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus:ring-0"
            />
          </div>

          {/* Area Scrollable dengan Native Feel */}
          <div
            ref={scrollRef}
            onWheel={handleWheel}
            className="max-h-95 overflow-y-auto overflow-x-hidden scroll-container touch-auto pointer-events-auto"
            style={{
              scrollbarWidth: 'thin',
              WebkitOverflowScrolling: 'touch'
            }}>
            <CommandList className="h-full overflow-visible pointer-events-auto">
              {filteredData.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center px-4">
                  <div className="p-3 rounded-full bg-muted/50">
                    <AlertCircle className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Data tidak ditemukan</p>
                    <p className="text-[11px] text-muted-foreground">Coba gunakan kata kunci yang lebih umum.</p>
                  </div>
                </div>
              ) : (
                <CommandGroup
                  heading={
                    <div className="flex items-center gap-2 px-1">
                      <Info className="w-3 h-3" />
                      <span>Ditemukan {filteredData.length} Standar Biaya</span>
                    </div>
                  }
                  className="p-2">
                  {filteredData.map((item, index) => (
                    <CommandItem
                      key={`${item.name}-${index}`}
                      onSelect={() => {
                        onPick(item.price)
                        setOpen(false)
                      }}
                      className="flex flex-col items-start p-3 mb-1 rounded-xl cursor-pointer border border-transparent hover:border-primary/10 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-all pointer-events-auto">
                      <div className="flex justify-between w-full items-start gap-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          {/* Nama Rute/Spesifikasi */}
                          <span className="font-bold text-[11px] text-foreground uppercase tracking-tight truncate">
                            {item.name}
                          </span>
                          {/* Deskripsi Detail (Uraian Barang) */}
                          <span className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                            {item.description}
                          </span>
                        </div>

                        {/* Nominal & Satuan */}
                        <div className="flex flex-col items-end shrink-0 pt-0.5">
                          <span className="font-mono text-[13px] font-bold text-primary">
                            {new Intl.NumberFormat('id-ID').format(item.price)}
                          </span>
                          <span className="text-[9px] font-medium bg-muted px-1.5 py-0.5 rounded mt-1 text-muted-foreground border border-border/40">
                            /{item.unit}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </div>

          {/* Footer Info */}
          <div className="p-2 border-t border-border/40 bg-muted/20">
            <p className="text-[9px] text-center text-muted-foreground italic">
              *Data bersumber dari SBU Kabupaten Kutai Barat
            </p>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
