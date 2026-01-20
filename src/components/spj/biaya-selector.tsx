import { useState } from 'react'
import { Check, ChevronsUpDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Opsi standar yang sering digunakan
const CATEGORIES = [
  'Uang Harian',
  'Uang Transport',
  'Biaya Penginapan',
  'Uang Representasi',
  'Sewa Kendaraan',
  'Biaya Tol & Parkir'
]

export function KategoriBiayaSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-muted-foreground uppercase">Kategori Biaya</label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-lg bg-muted/20 border-border/40 text-sm h-10 shadow-none font-normal">
            {value ? value : 'Pilih atau ketik kategori...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 shadow-xl border-border/40" align="start">
          <Command>
            <CommandInput
              placeholder="Cari atau ketik kategori baru..."
              value={value}
              onValueChange={(search) => {
                // Ini memungkinkan user mengetik custom value
                onChange(search)
              }}
            />
            <CommandList>
              <CommandEmpty className="p-2">
                <p className="text-[11px] text-muted-foreground px-2 italic">Tekan enter untuk menggunakan {value}</p>
              </CommandEmpty>
              <CommandGroup heading="Rekomendasi">
                {CATEGORIES.map((cat) => (
                  <CommandItem
                    key={cat}
                    value={cat}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                    className="text-sm cursor-pointer">
                    <Check className={cn('mr-2 h-4 w-4', value === cat ? 'opacity-100' : 'opacity-0')} />
                    {cat}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
