'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileSignature,
  Hash,
  Loader2,
  MapPin,
  Printer,
  Save,
  Search,
  UserPlus,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const schema = z.object({
  noSpd: z.string().optional().nullable(),
  tglSpd: z.string().min(10, 'Tanggal wajib diisi'),
  kotaTandaTangan: z.string().min(2, 'Kota wajib diisi'),
  signerPegawaiId: z.string().optional().nullable()
})

type FormValues = z.infer<typeof schema>

type Roster = {
  id: string
  order: number
  role: 'KEPALA_JALAN' | 'PENGIKUT'
  nama: string
  nip: string | null
  jabatan: string
}

type Pegawai = {
  id: string
  nama: string
  nip: string | null
  jabatan: string
}

type PegawaiResult = {
  id: string
  nama: string
  nip: string | null
  jabatan: string
  golongan: string | null
  pangkat: string | null
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

function toDateInputValue(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function SpdForm({
  spjId,
  initial,
  roster,
  pegawai
}: {
  spjId: string
  initial: {
    noSpd: string | null
    tglSpd: Date
    kotaTandaTangan: string
    signerPegawaiId: string | null
  }
  roster: Roster[]
  pegawai: Pegawai[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const rosterSorted = useMemo(
    () =>
      [...roster].sort((a, b) => {
        if (a.role !== b.role) return a.role === 'KEPALA_JALAN' ? -1 : 1
        return a.order - b.order
      }),
    [roster]
  )

  const defaultValues = useMemo<FormValues>(
    () => ({
      noSpd: initial.noSpd ?? '',
      tglSpd: toDateInputValue(initial.tglSpd),
      kotaTandaTangan: initial.kotaTandaTangan ?? 'Sendawar',
      signerPegawaiId: initial.signerPegawaiId ?? '__none__'
    }),
    [initial]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })

  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 300)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [results, setResults] = useState<PegawaiResult[]>([])
  const [selected, setSelected] = useState<PegawaiResult | null>(null)

  useEffect(() => {
    const id = form.getValues('signerPegawaiId')
    if (!id || id === '__none__') return
    const found = pegawai.find((p) => p.id === id)
    if (found) {
      setSelected({ ...found, golongan: null, pangkat: null })
      setQ(found.nama)
    }
  }, [pegawai, form])

  useEffect(() => {
    const query = debouncedQ.trim()
    if (query.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    async function run() {
      setLoadingSearch(true)
      try {
        const res = await fetch(`/api/pegawai/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        if (!cancelled) setResults(json.items)
      } catch {
        if (!cancelled) toast.error('Gagal mencari pegawai.')
      } finally {
        if (!cancelled) setLoadingSearch(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [debouncedQ])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const payload = {
        noSpd: values.noSpd?.trim() || null,
        tglSpd: values.tglSpd,
        kotaTandaTangan: values.kotaTandaTangan.trim(),
        signerPegawaiId: values.signerPegawaiId === '__none__' ? null : values.signerPegawaiId
      }
      const res = await fetch(`/api/spj/${spjId}/spd`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error()
      toast.success('SPD berhasil disimpan.')
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan SPD.')
    } finally {
      setSaving(false)
    }
  }

  const currentSignerId = form.watch('signerPegawaiId')

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* 1. ROSTER DISPLAY CARD */}
      <Card className="rounded-xl border-border/40 shadow-none bg-card/50 overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight">Subjek SPD</CardTitle>
              <p className="text-[11px] text-muted-foreground font-medium uppercase mt-0.5 tracking-wider">
                Otomatis Terbentuk dari Roster
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {rosterSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 border border-dashed rounded-xl border-border/60">
              <p className="text-xs text-muted-foreground italic">Roster kosong. Lengkapi personel di menu utama.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rosterSorted.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/50 group hover:border-primary/20 transition-all">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate leading-none">{r.nama}</span>
                      <Badge
                        variant={r.role === 'KEPALA_JALAN' ? 'default' : 'secondary'}
                        className="h-4 px-1.5 text-[8px] font-bold uppercase tracking-tighter">
                        {r.role === 'KEPALA_JALAN' ? 'Kepala' : 'Pengikut'}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mt-1.5 uppercase tracking-wide">
                      {r.jabatan}
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. SPD FORM CARD */}
      <Card className="rounded-xl border-border/40 shadow-none overflow-hidden">
        <CardHeader className="border-b border-border/40 px-6 py-5 bg-muted/5">
          <div className="flex items-center gap-3">
            <FileSignature className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Data Penerbitan SPD</CardTitle>
              <p className="text-[11px] text-muted-foreground font-medium uppercase mt-0.5 tracking-wider">
                Informasi Penandatanganan & Lokasi
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              <div className="grid gap-8 md:grid-cols-2">
                {/* NOMOR SPD */}
                <FormField
                  control={form.control}
                  name="noSpd"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Nomor SPD
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          className="h-11 rounded-xl bg-muted/10 border-border/40 font-mono text-sm px-4"
                          placeholder="Contoh: 094/002/ORG-TU.P/I/2026"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TANGGAL SPD */}
                <FormField
                  control={form.control}
                  name="tglSpd"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Tanggal SPD
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="h-11 rounded-xl bg-muted/10 border-border/40 text-sm px-4 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                {/* KOTA TTD */}
                <FormField
                  control={form.control}
                  name="kotaTandaTangan"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Kota Tanda Tangan
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-11 rounded-xl bg-muted/10 border-border/40 text-sm px-4"
                          placeholder="Nama Kota..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SIGNER COMBOBOX */}
                <FormField
                  control={form.control}
                  name="signerPegawaiId"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-3.5 h-3.5 text-muted-foreground" />
                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Pejabat Pemberi Perintah
                        </FormLabel>
                      </div>
                      <FormControl>
                        <div className="space-y-3">
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    value={q}
                                    onChange={(e) => {
                                      setQ(e.target.value)
                                      if (!open) setOpen(true)
                                      if (selected) setSelected(null)
                                    }}
                                    placeholder="Cari Pejabat..."
                                    className="h-11 pl-10 rounded-xl bg-muted/10 border-border/40 text-sm"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-11 w-11 rounded-xl border-border/40 shrink-0"
                                  onClick={() => {
                                    setSelected(null)
                                    setQ('')
                                    field.onChange('__none__')
                                  }}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </PopoverTrigger>

                            <PopoverContent className="w-[340px] p-0" align="start">
                              <Command shouldFilter={false}>
                                <CommandInput
                                  value={q}
                                  onValueChange={setQ}
                                  placeholder="Nama/NIP pejabat..."
                                  className="h-10"
                                />
                                <CommandList>
                                  {loadingSearch ? (
                                    <div className="p-6 flex justify-center">
                                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <>
                                      <CommandEmpty className="p-4 text-xs text-center text-muted-foreground">
                                        Minimal 2 karakter.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {results.map((p) => (
                                          <CommandItem
                                            key={p.id}
                                            onSelect={() => {
                                              setSelected(p)
                                              setQ(p.nama)
                                              field.onChange(p.id)
                                              setOpen(false)
                                            }}
                                            className="p-3 cursor-pointer">
                                            <div className="flex flex-col">
                                              <span className="font-semibold text-sm">{p.nama}</span>
                                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                                {p.nip} • {p.jabatan}
                                              </span>
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          {currentSignerId && currentSignerId !== '__none__' && (
                            <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02] transition-all animate-in slide-in-from-top-1">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-background border border-border/40 flex items-center justify-center shadow-sm">
                                  <FileSignature className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold leading-none">
                                    {selected?.nama ?? 'Pejabat Terpilih'}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide truncate max-w-[200px]">
                                    {selected?.nip ?? '-'} • {selected?.jabatan ?? ''}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="bg-border/40" />

              {/* FOOTER ACTIONS */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 px-6 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => window.open(`/spj/${spjId}/spd/print`, '_blank')}
                  disabled={rosterSorted.length === 0}>
                  <Printer className="w-4 h-4 mr-2" /> PREVIEW SPD PDF
                </Button>

                <Button
                  type="submit"
                  disabled={saving || rosterSorted.length === 0}
                  className="h-11 px-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-xs shadow-lg shadow-foreground/10 transition-all">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> MENYIMPAN...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> SIMPAN SPD
                    </>
                  )}
                </Button>
              </div>

              {rosterSorted.length === 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    Fungsi cetak & simpan dinonaktifkan karena data roster belum diisi.
                  </p>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
