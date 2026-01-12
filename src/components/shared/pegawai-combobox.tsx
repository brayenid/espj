'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'

export type PegawaiOption = {
  id: string
  nama: string
  jabatan: string
  nip?: string | null
}

export function PegawaiCombobox({
  value,
  onChange,
  options,
  placeholder = 'Pilih pegawai...',
  disabled
}: {
  value: string | null
  onChange: (val: string | null) => void
  options: PegawaiOption[]
  placeholder?: string
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  const selected = React.useMemo(() => options.find((o) => o.id === value) ?? null, [options, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-2xl"
          disabled={disabled}>
          {selected ? `${selected.nama} — ${selected.jabatan}` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari nama/jabatan..." />
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>

          <CommandGroup>
            <CommandItem
              value="__none__"
              onSelect={() => {
                onChange(null)
                setOpen(false)
              }}>
              <Check className={cn('mr-2 h-4 w-4', value === null ? 'opacity-100' : 'opacity-0')} />
              (Kosong)
            </CommandItem>

            {options.map((o) => (
              <CommandItem
                key={o.id}
                value={`${o.nama} ${o.jabatan} ${o.nip ?? ''}`}
                onSelect={() => {
                  onChange(o.id)
                  setOpen(false)
                }}>
                <Check className={cn('mr-2 h-4 w-4', o.id === value ? 'opacity-100' : 'opacity-0')} />
                <span className="truncate">{o.nama}</span>
                <span className="ml-2 truncate text-muted-foreground">— {o.jabatan}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
