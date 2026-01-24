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

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from '@/components/ui/command'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  ClipboardCheck,
  Crown,
  FileSignature,
  Hash,
  Loader2,
  MapPin,
  Printer,
  Save,
  Search,
  UserPlus,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- SCHEMAS & TYPES ---

const schema = z.object({
  noSpd: z.string().optional().nullable(),
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

// --- HELPERS ---

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

// --- MAIN COMPONENT ---

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

  // Signer Selection Logic
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

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500 text-left">
      {/* HEADER CARD */}
      <Card className="rounded-lg border-border/50 bg-card/40 shadow-none overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-md border border-border/50 shadow-xs">
                <FileSignature className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight uppercase">
                  Surat Perjalanan Dinas (SPD)
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
                  Administrasi Penerbitan & Penomoran
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-9 font-semibold text-xs border-border/60 shadow-none"
                onClick={() => window.open(`/spj/${spjId}/spd/print`, '_blank')}
                disabled={rosterSorted.length === 0}>
                <Printer className="w-3.5 h-3.5 mr-2" /> Preview PDF
              </Button>
              <Button
                size="sm"
                className="rounded-lg h-9 px-6 font-semibold text-xs shadow-none"
                onClick={form.handleSubmit(onSubmit)}
                disabled={saving || rosterSorted.length === 0}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                Simpan
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-8">
          <Form {...form}>
            <form className="space-y-8 sm:space-y-12">
              <div className="grid gap-8 lg:grid-cols-12">
                {/* SIDEBAR (Kiri) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* SIGNER DI ATAS */}
                  <Card className="rounded-xl border-border/40 shadow-none bg-muted/5 p-5">
                    <FormField
                      control={form.control}
                      name="signerPegawaiId"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-3.5 h-3.5 text-muted-foreground" />
                            <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                              Penandatangan
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger asChild>
                                <div
                                  className={cn(
                                    'group flex flex-col items-start p-3 w-full rounded-lg border border-border/50 bg-background hover:border-primary/30 transition-all cursor-pointer shadow-none',
                                    selected && 'border-primary/20 bg-primary/2'
                                  )}>
                                  {selected ? (
                                    <div className="w-full text-left">
                                      <div className="text-[12px] font-bold leading-tight">{selected.nama}</div>
                                      <div className="text-[9px] text-muted-foreground mt-1 uppercase tracking-tight truncate">
                                        {selected.jabatan}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Search className="w-3.5 h-3.5" />
                                      <span>Pilih Pejabat...</span>
                                    </div>
                                  )}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-[320px] p-0 shadow-2xl" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    value={q}
                                    onValueChange={setQ}
                                    placeholder="Nama/NIP..."
                                    className="h-9"
                                  />
                                  <CommandList>
                                    {loadingSearch ? (
                                      <div className="p-4 flex justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                      </div>
                                    ) : (
                                      <>
                                        <CommandEmpty className="p-4 text-[11px] text-center">
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
                                              className="p-3">
                                              <div className="flex flex-col">
                                                <span className="font-bold text-xs">{p.nama}</span>
                                                <span className="text-[9px] text-muted-foreground mt-0.5">
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>

                  {/* Personel List */}
                  <Card className="rounded-xl border-border/40 shadow-none bg-muted/5 p-5">
                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Personel
                    </div>
                    {rosterSorted.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground italic p-4 text-center border border-dashed rounded-lg">
                        Roster kosong.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rosterSorted.map((r, i) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background text-[11px] font-semibold">
                            <span className="truncate pr-2">
                              {i + 1}. {r.nama}
                            </span>
                            {r.role === 'KEPALA_JALAN' && <Crown className="w-3 h-3 text-primary shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* MAIN FORM AREA (Kanan) */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Row: Nomor SPD & Kota (Tanggal Dihapus) */}
                  <div className="grid gap-6 sm:grid-cols-2 bg-muted/10 p-4 sm:p-6 rounded-lg border border-border/30">
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
                              className="h-10 rounded-md border-border/50 bg-background shadow-none font-mono text-xs"
                              placeholder="094/002/..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              className="h-10 rounded-md border-border/50 bg-background shadow-none text-xs"
                              placeholder="Sendawar"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Area Peringatan jika Roster Kosong */}
                  {rosterSorted.length === 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                        Data roster belum tersedia. Mohon isi personel perjalanan terlebih dahulu.
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-primary/3 border border-primary/10">
                    <div className="flex gap-3">
                      <ClipboardCheck className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-[10px] text-primary/80 leading-relaxed font-medium">
                        Pengaturan nomor dan lokasi penerbitan akan diterapkan pada seluruh dokumen SPD yang dicetak.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
