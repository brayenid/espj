'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Briefcase,
  Crown,
  FileEdit,
  Hash,
  Loader2,
  Printer,
  Save,
  Search,
  UserCheck,
  Users,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- SCHEMAS & TYPES ---

const schema = z.object({
  nomor: z.string().optional().nullable(),
  untuk: z.string().min(3, "Kolom 'Untuk' wajib diisi"),
  signerPegawaiId: z
    .string()
    .min(1, 'Penandatangan wajib dipilih')
    .refine((v) => v !== '__none__', 'Penandatangan wajib dipilih')
})

type FormValues = z.infer<typeof schema>

type Roster = {
  id: string
  order: number
  role: 'KEPALA_JALAN' | 'PENGIKUT'
  nama: string
  nip: string | null
  jabatan: string
  pangkat: string | null
  golongan: string | null
}

type Pegawai = {
  id: string
  nama: string
  nip: string | null
  jabatan: string
  pangkat: string | null
  golongan: string | null
}

type Spj = {
  maksudDinas: string
  noSuratTugas: string | null
}

type Initial = {
  untuk: string
  signerPegawaiId: string | null
} | null

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

export default function SuratTugasForm({
  spjId,
  spj,
  initial,
  roster,
  pegawai
}: {
  spjId: string
  spj: Spj
  initial: Initial
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
      nomor: spj.noSuratTugas ?? '',
      untuk: initial?.untuk ?? spj.maksudDinas ?? '',
      signerPegawaiId: initial?.signerPegawaiId ?? '__none__'
    }),
    [initial, spj]
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
      setSelected({ ...found, golongan: found.golongan ?? null, pangkat: found.pangkat ?? null })
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
        nomor: values.nomor?.trim() || null,
        untuk: values.untuk,
        signerPegawaiId: values.signerPegawaiId
      }
      const res = await fetch(`/api/spj/${spjId}/surat-tugas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error()
      toast.success('Surat Tugas tersimpan.')
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan.')
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
                <FileEdit className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight uppercase">Surat Tugas Perjalanan</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
                  Pengelolaan Redaksi & Otoritas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-9 font-semibold text-xs border-border/60 shadow-none"
                onClick={() => window.open(`/spj/${spjId}/surat-tugas/print`, '_blank')}
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
                {/* SIDEBAR: SIGNER & PERSONEL (Kiri) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Signer Selection */}
                  <Card className="rounded-xl border-border/40 shadow-none bg-muted/5 p-5">
                    <FormField
                      control={form.control}
                      name="signerPegawaiId"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
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
                              <PopoverContent className="w-85 p-0 shadow-2xl" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput value={q} onValueChange={setQ} placeholder="Ketik nama/jabatan..." />
                                  <CommandList>
                                    {loadingSearch ? (
                                      <div className="p-4 flex justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      </div>
                                    ) : (
                                      <>
                                        <CommandEmpty className="p-4 text-xs text-muted-foreground">
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
                                                <span className="font-semibold text-sm">{p.nama}</span>
                                                <span className="text-[10px] text-muted-foreground">
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
                  {/* Row: Nomor Surat */}
                  <div className="bg-muted/10 p-4 sm:p-6 rounded-lg border border-border/30">
                    <FormField
                      control={form.control}
                      name="nomor"
                      render={({ field }) => (
                        <FormItem className="max-w-md space-y-3">
                          <div className="flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                            <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                              Nomor Surat Tugas
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              placeholder="090/001/ORG-TU.P/I/2026"
                              className="h-10 rounded-md border-border/50 bg-background shadow-none font-mono text-xs"
                            />
                          </FormControl>
                          <FormDescription className="text-[10px]">
                            Biarkan kosong jika belum ada nomor (Draft).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row: Uraian Tugas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                      <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                        Uraian Tugas (UNTUK)
                      </label>
                    </div>
                    <FormField
                      control={form.control}
                      name="untuk"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={8}
                              placeholder="Masukkan maksud perjalanan dinas secara lengkap..."
                              className="rounded-md border-border/50 bg-background shadow-none text-[13px] p-4 leading-relaxed focus-visible:ring-1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Empty State Warning */}
                  {rosterSorted.length === 0 && (
                    <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                      <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">
                        Data personel belum tersedia. Harap isi Roster SPJ terlebih dahulu untuk mengaktifkan tombol
                        simpan & cetak.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
