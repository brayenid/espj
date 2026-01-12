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
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Briefcase,
  Crown,
  FileEdit,
  FileText,
  Hash,
  Loader2,
  Printer,
  Save,
  Search,
  UserCheck,
  Users,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  nomor: string | null
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

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

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
      nomor: initial?.nomor ?? spj.noSuratTugas ?? '',
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

  const signerValue = form.watch('signerPegawaiId')

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* 1. SECTION: ROSTER DISPLAY */}
      <Card className="rounded-xl border-border/40 shadow-none bg-card/50 overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight">Personel yang Ditugaskan</CardTitle>
              <p className="text-[11px] text-muted-foreground font-medium uppercase mt-0.5">
                Ditarik otomatis dari Roster SPJ
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {rosterSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-xl border-border/60">
              <Users className="w-8 h-8 text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground italic">
                Belum ada personel. Harap isi roster terlebih dahulu.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rosterSorted.map((r) => (
                <div
                  key={r.id}
                  className="group flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background hover:border-primary/20 transition-all">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{r.nama}</span>
                      {r.role === 'KEPALA_JALAN' && (
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 text-[8px] font-bold border-primary/20 text-primary bg-primary/5">
                          <Crown className="w-2 h-2 mr-1" /> KEPALA
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">{r.jabatan}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. SECTION: SURAT TUGAS FORM */}
      <Card className="rounded-xl border-border/40 shadow-none overflow-hidden">
        <CardHeader className="border-b border-border/40 px-6 py-5 bg-muted/10">
          <div className="flex items-center gap-3">
            <FileEdit className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Detail Surat Tugas</CardTitle>
              <p className="text-[11px] text-muted-foreground font-medium uppercase mt-0.5 tracking-wider">
                Penyusunan Redaksi & Otoritas
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              <div className="grid gap-8 md:grid-cols-2">
                {/* NOMOR SURAT */}
                <FormField
                  control={form.control}
                  name="nomor"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
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
                          className="h-11 rounded-xl bg-muted/20 border-border/40 font-mono text-sm px-4 focus-visible:ring-1"
                          placeholder="Contoh: 090/001/ORG-TU.P/I/2026"
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] italic">
                        Biarkan kosong jika nomor belum diterbitkan (draft).
                      </FormDescription>
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
                        <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Pejabat Penandatangan
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
                                    placeholder="Cari Nama / NIP / Jabatan..."
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-11 w-11 rounded-xl border-border/40"
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
                                <CommandInput value={q} onValueChange={setQ} placeholder="Ketik nama pejabat..." />
                                <CommandList>
                                  {loadingSearch ? (
                                    <div className="p-4 flex justify-center">
                                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <>
                                      <CommandEmpty className="text-xs p-4 text-muted-foreground">
                                        Minimal 2 karakter untuk mencari.
                                      </CommandEmpty>
                                      <CommandGroup heading="Hasil Pencarian">
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

                          {signerValue && signerValue !== '__none__' && (
                            <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02] animate-in slide-in-from-top-1 duration-300">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-lg border border-border/40 shadow-sm">
                                  <UserCheck className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold">{selected?.nama ?? 'Loading...'}</div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                                    {selected?.jabatan}
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

              {/* URAIAN UNTUK */}
              <FormField
                control={form.control}
                name="untuk"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                      <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Uraian Tugas (UNTUK)
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={6}
                        className="rounded-xl bg-muted/20 border-border/40 text-sm p-4 leading-relaxed focus-visible:ring-1"
                        placeholder="Masukkan maksud perjalanan dinas secara lengkap..."
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] italic">
                      Redaksi ini akan muncul pada kolom UNTUK di dokumen fisik Surat Tugas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="bg-border/40" />

              {/* ACTION FOOTER */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 px-6 text-xs font-bold text-muted-foreground hover:text-foreground"
                  onClick={() => window.open(`/spj/${spjId}/surat-tugas/print`, '_blank')}
                  disabled={rosterSorted.length === 0}>
                  <Printer className="w-4 h-4 mr-2" /> PREVIEW PDF
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    disabled={saving || rosterSorted.length === 0}
                    className="h-11 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-xs shadow-sm transition-all">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> MENYIMPAN...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> SIMPAN SURAT TUGAS
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {rosterSorted.length === 0 && (
                <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-xl flex items-center gap-3">
                  <X className="w-4 h-4 text-destructive" />
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                    Tombol simpan & cetak dinonaktifkan karena data personel belum tersedia.
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
