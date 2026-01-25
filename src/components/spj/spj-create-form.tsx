'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

import { CalendarIcon, ArrowLeft, Save, Loader2, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Import Database Offline
import { db } from '@/lib/offline-db'

const schema = z.object({
  tempatTujuan: z.string().min(2, 'Tempat tujuan minimal 2 karakter'),
  maksudDinas: z.string().min(5, 'Maksud dinas minimal 5 karakter'),
  alatAngkut: z.string().optional(),
  tempatBerangkat: z.string().optional(),
  kotaTandaTangan: z.string().optional(),
  tglBerangkat: z.string().min(8, 'Tanggal berangkat wajib diisi'),
  tglKembali: z.string().min(8, 'Tanggal kembali wajib diisi'),
  noSuratTugas: z.string().optional(),
  noSpd: z.string().optional(),
  noTelaahan: z.string().optional()
})

type FormState = z.infer<typeof schema>

const initial: FormState = {
  tempatTujuan: '',
  maksudDinas: '',
  alatAngkut: 'Darat',
  tempatBerangkat: 'Sendawar',
  kotaTandaTangan: 'Sendawar',
  tglBerangkat: '',
  tglKembali: '',
  noSuratTugas: '',
  noSpd: '',
  noTelaahan: ''
}

function parseYMD(value: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split('-').map((v) => Number(v))
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function formatYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fmtDateId(date: Date) {
  try {
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

function DatePickerStringField({
  label,
  value,
  onChange,
  placeholder = 'Pilih tanggal'
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const selected = parseYMD(value)

  return (
    <div className="space-y-2.5">
      <Label className="text-[13px] font-medium text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-between rounded-md border-border/50 bg-background/50 h-10 text-left font-normal shadow-sm hover:bg-muted/30 transition-all',
              !selected && 'text-muted-foreground'
            )}>
            <span className="text-sm">{selected ? fmtDateId(selected) : placeholder}</span>
            <CalendarIcon className="h-4 w-4 opacity-40" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={selected} onSelect={(d) => onChange(d ? formatYMD(d) : '')} initialFocus />
        </PopoverContent>
      </Popover>
      <input type="hidden" value={value} readOnly />
    </div>
  )
}

export default function SpjCreateForm() {
  const router = useRouter()
  const [values, setValues] = useState<FormState>(initial)
  const [loading, setLoading] = useState(false)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      toast.error('Cek kembali input yang wajib diisi.')
      return
    }

    setLoading(true)

    try {
      // Pastikan DB terbuka (Penting untuk Next.js 16)
      if (!db.isOpen()) await db.open()

      const tempId = window.crypto.randomUUID()
      // Deep clone payload agar benar-benar serializable (menghindari error IndexedDB)
      const cleanPayload = JSON.parse(JSON.stringify(parsed.data))

      // 1. SIMPAN LOKAL (Dual Write)
      // Kita gunakan await secara ketat agar tidak ada race condition dengan navigasi
      await db.offlineQueue.put({
        id: tempId,
        type: 'TELAAHAN',
        payload: cleanPayload,
        synced: 0,
        updatedAt: Date.now()
      })

      // 2. LOGIKA ONLINE
      if (navigator.onLine) {
        try {
          const res = await fetch('/api/spj', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...cleanPayload, id: tempId })
          })

          if (res.ok) {
            await db.offlineQueue.update(tempId, { synced: 1 })
            toast.success('SPJ draft berhasil dibuat online.')
            router.push(`/spj/${tempId}`)
            router.refresh()
            return // Keluar dari fungsi jika sukses online
          }
        } catch (fetchError) {
          console.error('Gagal fetch ke server:', fetchError)
        }
      }

      // 3. FALLBACK OFFLINE
      // Baris ini dieksekusi jika sedang offline atau fetch gagal
      toast('Tersimpan secara lokal (Offline Mode)', {
        description: 'Data akan otomatis disinkronkan saat internet kembali menyala.',
        icon: <WifiOff className="w-4 h-4 text-amber-500" />
      })

      router.push(`/spj/${tempId}`)
    } catch (error) {
      console.error('Save Error:', error)
      toast.error('Gagal menyimpan draf ke perangkat.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <section className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Tempat Tujuan</Label>
            <Input
              value={values.tempatTujuan}
              onChange={set('tempatTujuan')}
              placeholder="Misal: Samarinda"
              className="h-10 border-border/50 bg-background/50 rounded-md focus-visible:ring-1 shadow-sm"
              required
            />
          </div>

          <div className="space-y-2.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Alat Angkut</Label>
            <Input
              value={values.alatAngkut ?? ''}
              onChange={set('alatAngkut')}
              placeholder="Darat / Udara"
              className="h-10 border-border/50 bg-background/50 rounded-md focus-visible:ring-1 shadow-sm"
            />
          </div>

          <DatePickerStringField
            label="Tanggal Berangkat"
            value={values.tglBerangkat}
            onChange={(v) => setValues((prev) => ({ ...prev, tglBerangkat: v }))}
          />

          <DatePickerStringField
            label="Tanggal Kembali"
            value={values.tglKembali}
            onChange={(v) => setValues((prev) => ({ ...prev, tglKembali: v }))}
          />
        </div>

        <div className="space-y-2.5">
          <Label className="text-[13px] font-medium text-muted-foreground">Maksud Perjalanan Dinas</Label>
          <Textarea
            value={values.maksudDinas}
            onChange={set('maksudDinas')}
            rows={3}
            placeholder="Tuliskan tujuan spesifik kegiatan dinas..."
            className="border-border/50 bg-background/50 rounded-md focus-visible:ring-1 shadow-sm resize-none"
            required
          />
        </div>
      </section>

      <div className="space-y-4">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Detail Administrasi (Opsional)
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2.5">
            <Label className="text-[13px] font-medium text-muted-foreground">No. Telaahan</Label>
            <Input
              value={values.noTelaahan ?? ''}
              onChange={set('noTelaahan')}
              className="h-9 border-border/50 bg-muted/20 rounded-md font-mono text-xs"
            />
          </div>
          <div className="space-y-2.5">
            <Label className="text-[13px] font-medium text-muted-foreground">No. Surat Tugas</Label>
            <Input
              value={values.noSuratTugas ?? ''}
              onChange={set('noSuratTugas')}
              className="h-9 border-border/50 bg-muted/20 rounded-md font-mono text-xs"
            />
          </div>
          <div className="space-y-2.5">
            <Label className="text-[13px] font-medium text-muted-foreground">No. SPD</Label>
            <Input
              value={values.noSpd ?? ''}
              onChange={set('noSpd')}
              className="h-9 border-border/50 bg-muted/20 rounded-md font-mono text-xs"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border/40 flex items-center justify-between">
        <Button asChild type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link href="/spj" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Batal
          </Link>
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-md px-8 shadow-lg shadow-foreground/5 transition-all">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Draft
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
