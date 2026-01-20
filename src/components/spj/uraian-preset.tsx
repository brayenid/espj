import { Button } from '@/components/ui/button'
import { Zap, MapPin } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'

interface UraianPresetPickerProps {
  onPick: (val: string) => void
  asal?: string
  tujuan?: string
}

export function UraianPresetPicker({ onPick, asal = '[Asal]', tujuan = '[Tujuan]' }: UraianPresetPickerProps) {
  // Pindahkan ke dalam komponen agar bisa menggunakan props asal & tujuan
  const URAIAN_PRESETS = [
    {
      label: `Transportasi: ${asal} - ${tujuan} (PP)`,
      value: `Transportasi dari ${asal} ke ${tujuan} (PP)`
    },
    {
      label: `Udara: ${asal} - ${tujuan} (PP)`,
      value: `Transportasi udara rute ${asal} - ${tujuan} (PP)`
    },
    {
      label: 'Penginapan (Hotel)',
      value: `Biaya penginapan / hotel di ${tujuan} selama pelaksanaan tugas`
    },
    {
      label: 'Sewa Kendaraan',
      value: `Biaya sewa kendaraan operasional di ${tujuan}`
    },
    {
      label: 'BBM & Tol',
      value: 'Pembelian BBM dan pembayaran tol operasional'
    },
    {
      label: 'Uang Harian',
      value: `Uang harian perjalanan dinas ke ${tujuan}`
    }
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[10px] font-bold border-primary/20 bg-primary/5 text-primary shadow-none">
          <Zap className="w-3 h-3 mr-1.5" /> Gunakan Preset
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <Command>
          <CommandGroup heading="Pilih Template Uraian">
            <CommandList>
              {URAIAN_PRESETS.map((p, index) => (
                <CommandItem key={index} onSelect={() => onPick(p.value)} className="text-xs cursor-pointer py-2">
                  {p.label.includes(tujuan) && <MapPin className="w-3.5 h-3.5 mr-2 text-primary/60" />}
                  {p.label}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
