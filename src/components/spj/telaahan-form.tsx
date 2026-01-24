/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

// Import Preset khusus Telaahan
import PRESETS from '@/data/telaahan-presets.json'

import {
  BookOpen,
  Crown,
  FileText,
  ListChecks,
  Loader2,
  MessageSquareText,
  Plus,
  Printer,
  Save,
  Trash2,
  Users,
  Zap,
  Calendar as CalendarIcon,
  Search,
  UserCheck
} from 'lucide-react'

// --- HELPER FUNCTIONS ---

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

/**
 * Fungsi untuk mengambil nama depan dan membersihkan simbol
 * Digunakan untuk auto-generate teks pada bagian Fakta
 */
const rosterView = (roster: any[]) => {
  const firstNames = roster.map((data) => {
    const firstNameRaw = data.nama.trim().split(/\s+/)[0]
    return firstNameRaw.replace(/[^a-zA-Z0-9]/g, '')
  })
  return firstNames.filter(Boolean).join(', ')
}

const schema = z.object({
  kepada: z.string().optional().nullable(),
  sifat: z.string().optional().nullable(),
  lampiran: z.string().optional().nullable(),
  perihal: z.string().min(3, 'Perihal wajib diisi'),
  dasar: z.string().optional().nullable(),
  praAnggapan: z.array(z.object({ value: z.string().min(1, 'Tidak boleh kosong') })),
  fakta: z.array(z.object({ value: z.string().min(1, 'Tidak boleh kosong') })),
  analisis: z.string().optional().nullable(),
  kesimpulan: z.string().optional().nullable(),
  saran: z.string().optional().nullable(),
  tglTelaahan: z.date().optional(),

  // Signer fields (Snapshot Pattern)
  signerPegawaiId: z.string().optional().nullable(),
  signerNama: z.string().optional().nullable(),
  signerNip: z.string().optional().nullable(),
  signerJabatan: z.string().optional().nullable(),
  signerPangkat: z.string().optional().nullable(),
  signerGolongan: z.string().optional().nullable(),
  signerJabatanTampil: z.string().optional().nullable()
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

type PegawaiResult = {
  id: string
  nama: string
  nip: string | null
  jabatan: string
  golongan: string | null
  pangkat: string | null
}

type InitialTelaahan = any

type PresetKey = keyof typeof PRESETS
type PresetItem = (typeof PRESETS)[PresetKey][number]

function normalizePreview(s: string, max = 120) {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

// --- COMPONENTS ---

function SignerCombobox({
  label,
  value,
  onChange
}: {
  label: string
  value: PegawaiResult | null
  onChange: (v: PegawaiResult | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState(value?.nama ?? '')
  const debouncedQ = useDebouncedValue(q, 300)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PegawaiResult[]>([])

  useEffect(() => {
    const query = debouncedQ.trim()
    if (query.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch(`/api/pegawai/search?q=${encodeURIComponent(query)}`)
        const json = (await res.json()) as { items: PegawaiResult[] }
        if (!cancelled) setResults(json.items ?? [])
      } catch {
        if (!cancelled) toast.error('Gagal mencari pegawai.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [debouncedQ])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'group flex flex-col items-start p-4 w-full rounded-xl border border-border/50 bg-background hover:border-border transition-all cursor-pointer shadow-none',
              value && 'border-primary/20 bg-primary/2'
            )}>
            {value ? (
              <div className="w-full text-left">
                <div className="text-sm font-semibold">{value.nama}</div>
                <div className="text-[10px] text-muted-foreground mt-1 truncate">
                  {value.nip ?? '-'} • {value.jabatan || 'Pejabat'}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="w-4 h-4" />
                <span>Cari penandatangan...</span>
              </div>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-85 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput value={q} onValueChange={setQ} placeholder="Cari pegawai..." className="h-10" />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center p-6">
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
                          onChange(p)
                          setQ(p.nama)
                          setOpen(false)
                        }}
                        className="p-3 cursor-pointer">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{p.nama}</span>
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
    </div>
  )
}

function PresetPicker({
  open,
  onOpenChange,
  title,
  description,
  items,
  onPick
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: string
  items: PresetItem[]
  onPick: (text: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border-border/50 p-0 shadow-2xl text-left">
        <DialogHeader className="px-6 py-4 border-b border-border/40 bg-muted/20">
          <DialogTitle className="text-sm font-bold uppercase tracking-tight">{title}</DialogTitle>
          {description ? <DialogDescription className="text-[12px] mt-1">{description}</DialogDescription> : null}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-2 p-4">
            {items.map((p) => (
              <button
                key={p.id}
                type="button"
                className="group w-full rounded-md border border-border/40 bg-background p-4 text-left transition-all hover:bg-muted/30 active:scale-[0.98]"
                onClick={() => onPick(p.text)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">
                      {p.title}
                    </div>
                    <div className="mt-1 text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
                      {normalizePreview(p.text, 180)}
                    </div>
                  </div>
                  <Badge variant="outline" className="h-6 text-[9px] uppercase">
                    Pilih
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// --- MAIN COMPONENT ---

export default function TelaahanForm({
  spjId,
  initial,
  initialSpj,
  roster
}: {
  spjId: string
  initial: InitialTelaahan
  initialSpj: any
  roster: Roster[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [presetOpen, setPresetOpen] = useState<null | PresetKey>(null)

  const defaultValues = useMemo<FormValues>(
    () => ({
      kepada: initial?.kepada ?? 'Sekretaris Daerah Kabupaten Kutai Barat',
      sifat: initial?.sifat ?? 'Penting',
      lampiran: initial?.lampiran ?? '-',
      perihal: initial?.perihal ?? initialSpj?.maksudDinas ?? '',
      dasar: initial?.dasar ?? '',
      praAnggapan: (initial?.praAnggapan ?? []).map((v: any) => ({ value: v })),
      fakta: (initial?.fakta ?? []).map((v: any) => ({ value: v })),
      analisis: initial?.analisis ?? '',
      kesimpulan: initial?.kesimpulan ?? '',
      saran: initial?.saran ?? '',
      tglTelaahan: initial?.tglTelaahan ? new Date(initial.tglTelaahan) : new Date(),

      // Signer Defaults
      signerPegawaiId: initial?.signerPegawaiId ?? null,
      signerNama: initial?.signerNama ?? null,
      signerNip: initial?.signerNip ?? null,
      signerJabatan: initial?.signerJabatan ?? null,
      signerPangkat: initial?.signerPangkat ?? null,
      signerGolongan: initial?.signerGolongan ?? null,
      signerJabatanTampil: initial?.signerJabatanTampil ?? ''
    }),
    [initial, initialSpj]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })

  const pra = useFieldArray({ control: form.control, name: 'praAnggapan' })
  const fak = useFieldArray({ control: form.control, name: 'fakta' })

  // State local untuk UI Signer Picker
  const [signer, setSigner] = useState<PegawaiResult | null>(
    initial?.signerPegawaiId
      ? {
          id: initial.signerPegawaiId,
          nama: initial.signerNama,
          nip: initial.signerNip,
          jabatan: initial.signerJabatan,
          pangkat: initial.signerPangkat,
          golongan: initial.signerGolongan
        }
      : null
  )

  // Sinkronisasi signer ke form
  useEffect(() => {
    if (signer) {
      form.setValue('signerPegawaiId', signer.id)
      form.setValue('signerNama', signer.nama)
      form.setValue('signerNip', signer.nip)
      form.setValue('signerJabatan', signer.jabatan)
      form.setValue('signerPangkat', signer.pangkat)
      form.setValue('signerGolongan', signer.golongan)
    } else {
      form.setValue('signerPegawaiId', null)
    }
  }, [signer, form])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const payload = {
        ...values,
        tglTelaahan: values.tglTelaahan?.toISOString(),
        praAnggapan: values.praAnggapan.map((x) => x.value.trim()).filter(Boolean),
        fakta: values.fakta.map((x) => x.value.trim()).filter(Boolean)
      }

      const res = await fetch(`/api/spj/${spjId}/telaahan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error()

      toast.success('Telaahan tersimpan.')
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan telaahan.')
    } finally {
      setSaving(false)
    }
  }

  // Fungsi untuk memasukkan teks roster otomatis ke Fakta
  const injectRosterToFakta = () => {
    const text = `Bahwa Sdr. ${rosterView(roster)} ditugaskan untuk melaksanakan kegiatan ${initialSpj?.maksudDinas || 'perjalanan dinas'}.`
    fak.append({ value: text })
  }

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500 text-left">
      <Card className="rounded-lg border-border/50 bg-card/40 shadow-none overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-md border border-border/50 shadow-xs">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight uppercase">Telaahan Staf</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
                  Editor Dokumen Staf
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-9 font-semibold text-xs border-border/60 shadow-none"
                onClick={() => window.open(`/spj/${spjId}/telaahan/print`, '_blank')}>
                <Printer className="w-3.5 h-3.5 mr-2" /> Preview PDF
              </Button>
              <Button
                size="sm"
                className="rounded-lg h-9 px-6 font-semibold text-xs shadow-none"
                onClick={form.handleSubmit(onSubmit)}
                disabled={saving}>
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
                {/* SIDEBAR: SIGNER & PERSONEL */}
                <div className="lg:col-span-4 space-y-6">
                  <Card className="rounded-xl border-border/40 shadow-none bg-muted/5 p-5">
                    <SignerCombobox label="Penandatangan" value={signer} onChange={setSigner} />

                    <FormField
                      control={form.control}
                      name="signerJabatanTampil"
                      render={({ field }) => (
                        <FormItem className="mt-4 space-y-1.5">
                          <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">
                            Jabatan Tampil (Opsional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              placeholder="Contoh: Plt. KEPALA BAGIAN..."
                              className="h-9 rounded-lg text-xs shadow-none bg-background"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </Card>

                  <Card className="rounded-xl border-border/40 shadow-none bg-muted/5 p-5">
                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Personel
                    </div>
                    <div className="space-y-2">
                      {roster.map((r, i) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background text-[11px] font-semibold">
                          <span>
                            {i + 1}. {r.nama}
                          </span>
                          {r.role === 'KEPALA_JALAN' && <Crown className="w-3 h-3 text-primary fill-primary/10" />}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* MAIN FORM */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-4 bg-muted/10 p-4 sm:p-5 rounded-lg border border-border/30">
                    <FormField
                      control={form.control}
                      name="tglTelaahan"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5 flex flex-col">
                          <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground">
                            Tanggal
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'h-9 w-full rounded-md border-border/40 text-xs px-4 font-mono justify-start text-left font-normal shadow-none',
                                    !field.value && 'text-muted-foreground'
                                  )}>
                                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                  {field.value ? (
                                    format(field.value, 'PPP', { locale: localeId })
                                  ) : (
                                    <span>Pilih tanggal</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-md shadow-xl border-border/40" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="kepada"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground">
                            Kepada
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              className="h-9 rounded-md border-border/50 bg-background shadow-none text-xs"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sifat"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground">Sifat</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              className="h-9 rounded-md border-border/50 bg-background shadow-none text-xs"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lampiran"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground">
                            Lampiran
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              className="h-9 rounded-md border-border/50 bg-background shadow-none text-xs"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="perihal"
                    render={({ field }) => (
                      <FormItem className="space-y-2.5">
                        <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                          Perihal Telaahan
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ''}
                            rows={3}
                            className="rounded-md border-border/50 bg-background shadow-none text-[13px] font-medium resize-none focus-visible:ring-1"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* SECTIONS: I - VI */}
                  {[
                    { id: 'dasar', label: 'I. DASAR', icon: BookOpen },
                    { id: 'praAnggapan', label: 'II. PRA-ANGGAPAN', icon: ListChecks, array: pra },
                    {
                      id: 'fakta',
                      label: 'III. FAKTA MEMENGARUHI',
                      icon: ListChecks,
                      array: fak,
                      action: injectRosterToFakta,
                      actionLabel: 'Auto Roster'
                    },
                    { id: 'analisis', label: 'IV. ANALISIS', icon: MessageSquareText },
                    { id: 'kesimpulan', label: 'V. KESIMPULAN', icon: MessageSquareText },
                    { id: 'saran', label: 'VI. SARAN', icon: MessageSquareText }
                  ].map((sec: any) => (
                    <div key={sec.id} className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <sec.icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                            {sec.label}
                          </label>
                        </div>
                        <div className="flex gap-2">
                          {sec.action && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors px-2"
                              onClick={sec.action}>
                              <Users className="w-3 h-3 mr-1" /> {sec.actionLabel}
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-md text-[10px] font-bold border-primary/20 text-primary bg-primary/5 shadow-none"
                            onClick={() => setPresetOpen(sec.id as any)}>
                            <Zap className="w-3 h-3 mr-1.5" /> Preset
                          </Button>
                          {sec.array && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-md text-[10px] border-border/60 shadow-none px-2"
                              onClick={() => sec.array.append({ value: '' })}>
                              <Plus className="w-3 h-3 mr-1" /> Tambah
                            </Button>
                          )}
                        </div>
                      </div>

                      {sec.array ? (
                        <div className="grid gap-3">
                          {sec.array.fields.map((f: any, idx: number) => (
                            <div key={f.id} className="flex gap-2 group items-start">
                              <div className="h-9 w-9 shrink-0 flex items-center justify-center text-[10px] font-mono border border-border/40 rounded-md bg-muted/20">
                                {idx + 1}
                              </div>
                              <FormField
                                control={form.control}
                                name={`${sec.id}.${idx}.value` as any}
                                render={({ field }) => (
                                  <FormControl className="flex-1">
                                    <Textarea
                                      {...field}
                                      className="min-h-15 rounded-md border-border/50 bg-background shadow-none text-[13px] py-2"
                                    />
                                  </FormControl>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors border"
                                onClick={() => sec.array.remove(idx)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name={sec.id as any}
                          render={({ field }) => (
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value ?? ''}
                                rows={sec.id === 'dasar' ? 6 : 4}
                                className="rounded-md border-border/50 bg-background shadow-none text-[13px] p-4 leading-relaxed"
                              />
                            </FormControl>
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* RENDER MODALS PRESET */}
      {(['dasar', 'analisis', 'kesimpulan', 'saran', 'praAnggapan', 'fakta'] as const).map((key) => (
        <PresetPicker
          key={key}
          open={presetOpen === key}
          onOpenChange={(v) => setPresetOpen(v ? key : null)}
          title={`Pilih Preset ${key}`}
          items={[...(PRESETS[key as PresetKey] || [])]}
          onPick={(text) => {
            if (key === 'praAnggapan' || key === 'fakta') {
              ;(key === 'praAnggapan' ? pra : fak).append({ value: text })
            } else {
              form.setValue(key as any, text, { shouldDirty: true })
            }
            setPresetOpen(null)
          }}
        />
      ))}
    </div>
  )
}
