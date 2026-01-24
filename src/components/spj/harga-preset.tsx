'use client'

import * as React from 'react'
import { Banknote, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'
import daftarBiaya from '@/data/standar-biaya.json'

interface HargaPresetPickerProps {
  onPick: (price: number) => void
}

export function HargaPresetPicker({ onPick }: HargaPresetPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Hook untuk mendeteksi mobile (biasanya < 768px)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const filteredData = React.useMemo(() => {
    const seen = new Set()
    const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean)

    return daftarBiaya
      .filter((item) => {
        const nameLower = item.name.toLowerCase()
        const descLower = item.description.toLowerCase()
        const combinedText = `${nameLower} ${descLower} ${item.price}`.toLowerCase()

        const duplicateKey = `${nameLower}-${descLower}-${item.price}`.replace(/\s+/g, '')
        if (seen.has(duplicateKey)) return false
        seen.add(duplicateKey)

        if (searchTerms.length === 0) return true
        return searchTerms.every((term) => combinedText.includes(term))
      })
      .slice(0, 100)
  }, [search])

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [search])

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop += e.deltaY
    }
  }

  // Konten Utama Picker (di-extract agar bisa dipakai di Popover maupun Drawer)
  const PickerContent = (
    <Command shouldFilter={false} className="flex flex-col h-[80vh] md:h-full bg-popover">
      {/* Container baru untuk mengontrol icon & input */}
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Cari rute atau kategori..."
        className="flex h-11 w-full! rounded-none bg-transparent py-3 text-sm outline-none border-none focus:ring-0"
      />

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-container touch-auto"
        style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
        <CommandList className="h-full overflow-visible">
          {filteredData.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center px-4">
              <AlertCircle className="w-10 h-10 text-muted-foreground/20" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Data tidak ditemukan</p>
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
                  className="flex flex-col items-start p-3 mb-1 rounded-xl cursor-pointer border border-transparent hover:border-primary/10 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-all">
                  <div className="flex justify-between w-full items-start gap-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-bold text-[11px] md:text-[12px] text-foreground uppercase tracking-tight truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] md:text-[11px] text-muted-foreground leading-snug line-clamp-2">
                        {item.description}
                      </span>
                    </div>
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

      <div className="p-3 border-t border-border/40 bg-muted/20 pb-safe">
        <p className="text-[9px] text-center text-muted-foreground italic">
          *Data bersumber dari SBU Kabupaten Kutai Barat
        </p>
      </div>
    </Command>
  )

  if (isDesktop) {
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
            Lihat SBU
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-112.5 p-0 shadow-2xl border-border/40 overflow-hidden"
          align="end"
          onOpenAutoFocus={(e) => e.preventDefault()}>
          {PickerContent}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 text-[10px] font-bold rounded-lg px-3 border-primary/20 bg-primary/5 text-primary shadow-none',
            open && 'ring-2 ring-primary/20 bg-primary/10'
          )}>
          <Banknote className="w-3.5 h-3.5 mr-1.5" />
          PRESET SBU
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-0 h-[85vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Pilih Standar Biaya</DrawerTitle>
        </DrawerHeader>
        {PickerContent}
      </DrawerContent>
    </Drawer>
  )
}
