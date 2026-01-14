/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useMemo, useState } from 'react'
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

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import PRESETS from '@/data/telaahan-presets.json'
import {
  BookOpen,
  CalendarDays,
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
  Calendar as CalendarIcon
} from 'lucide-react'

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
  tglTelaahan: z.date().optional()
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

type InitialTelaahan = {
  kepada: string | null
  sifat: string | null
  lampiran: string | null
  perihal: string | null
  dasar: string | null
  praAnggapan: string[]
  fakta: string[]
  analisis: string | null
  kesimpulan: string | null
  saran: string | null
  tglTelaahan?: string | Date | null
} | null

type PresetKey = keyof typeof PRESETS
type PresetItem = (typeof PRESETS)[PresetKey][number]

function normalizePreview(s: string, max = 120) {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
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
      <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden rounded-t-xl sm:rounded-lg border-border/50 p-0 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/40 bg-muted/20">
          <DialogTitle className="text-sm font-semibold tracking-tight">{title}</DialogTitle>
          {description ? <DialogDescription className="text-[12px] mt-1">{description}</DialogDescription> : null}
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] sm:max-h-[60vh]">
          <div className="grid gap-2 p-4">
            {items.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                Belum ada preset tersedia.
              </div>
            ) : (
              items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="group w-full rounded-md border border-border/40 bg-background p-4 text-left transition-all hover:bg-muted/30 hover:border-border focus:ring-1 focus:ring-ring active:scale-[0.98]"
                  onClick={() => onPick(p.text)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">
                        {p.title}
                      </div>
                      <div className="mt-1 text-[12px] text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-2">
                        {normalizePreview(p.text, 180)}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="h-6 text-[9px] uppercase tracking-tighter opacity-100 sm:opacity-50 sm:group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      Pilih
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

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

  const defaultValues = useMemo<FormValues>(() => {
    return {
      kepada: initial?.kepada ?? 'Sekretaris Daerah Kabupaten Kutai Barat',
      sifat: initial?.sifat ?? 'Penting',
      lampiran: initial?.lampiran ?? '-',
      perihal: initialSpj?.maksudDinas ?? '',
      dasar: initial?.dasar ?? '',
      praAnggapan: (initial?.praAnggapan ?? []).map((v) => ({ value: v })),
      fakta: (initial?.fakta ?? []).map((v) => ({ value: v })),
      analisis: initial?.analisis ?? '',
      kesimpulan: initial?.kesimpulan ?? '',
      saran: initial?.saran ?? '',
      tglTelaahan: initial?.tglTelaahan ? new Date(initial.tglTelaahan) : new Date()
    }
  }, [initial, initialSpj])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })

  const pra = useFieldArray({ control: form.control, name: 'praAnggapan' })
  const fak = useFieldArray({ control: form.control, name: 'fakta' })

  function applyPreset(key: PresetKey, text: string) {
    form.setValue(key as any, text, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setPresetOpen(null)
  }

  function appendPresetToArray(arrayHelper: any, text: string) {
    arrayHelper.append({ value: text })
    setPresetOpen(null)
  }

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

      if (!res.ok) {
        toast.error('Gagal menyimpan telaahan.')
        setSaving(false)
        return
      }

      toast.success('Telaahan tersimpan.')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
      <Card className="rounded-lg border-border/50 bg-card/40 shadow-none overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-md border border-border/50 shadow-xs">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight">Telaahan Staf</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
                Editor Dokumen Staf
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 sm:space-y-12">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-4 bg-muted/10 p-4 sm:p-5 rounded-lg border border-border/30">
                <FormField
                  control={form.control}
                  name="tglTelaahan"
                  render={({ field }) => (
                    <FormItem className="space-y-3 flex flex-col">
                      <div className="flex items-center gap-2 mb-1.5">
                        <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground">Tanggal</FormLabel>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'h-9 w-full rounded-md border-border/40 text-sm px-4 font-mono justify-start text-left font-normal shadow-none',
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kepada"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground">Kepada</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          className="h-9 rounded-md border-border/50 bg-background shadow-none text-xs"
                        />
                      </FormControl>
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lampiran"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground">Lampiran</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          className="h-9 rounded-md border-border/50 bg-background shadow-none text-xs"
                        />
                      </FormControl>
                      <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="bg-border/40" />

              {/* I. DASAR */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="dasar"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                          <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                            I. DASAR
                          </FormLabel>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 sm:h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-sky-500 text-primary bg-white px-3 w-full sm:w-auto shadow-none"
                          onClick={() => setPresetOpen('dasar')}>
                          <Zap className="w-3 h-3 mr-1.5" /> Preset
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          rows={6}
                          className="rounded-md border-border/50 bg-background shadow-none text-sm leading-relaxed p-4"
                          placeholder="Masukan dasar perjalanan atau lihat preset"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* II. PRA-ANGGAPAN */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                      II. PRA-ANGGAPAN
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 sm:h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-sky-500 text-primary bg-white px-3 w-full sm:w-auto shadow-none"
                      onClick={() => setPresetOpen('praAnggapan' as any)}>
                      <Zap className="w-3 h-3 mr-1.5" /> Preset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 sm:h-7 rounded-md text-[10px] border-border/60 shadow-none px-3 w-full sm:w-auto"
                      onClick={() => pra.append({ value: '' })}>
                      <Plus className="w-3 h-3 mr-1.5" /> Tambah Poin
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {pra.fields.length === 0 ? (
                    <div className="p-4 text-center border border-dashed rounded-md text-xs text-muted-foreground">
                      Klik &quot;Tambah Poin&quot; atau &quot;Preset&quot; untuk mengisi pra-anggapan.
                    </div>
                  ) : (
                    pra.fields.map((f, idx) => (
                      <FormField
                        key={f.id}
                        control={form.control}
                        name={`praAnggapan.${idx}.value`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <div className="flex gap-2 group items-start">
                              <div className="h-9 w-9 shrink-0 flex items-center justify-center text-[10px] font-mono border border-border/40 rounded-md bg-muted/20 text-muted-foreground">
                                {idx + 1}
                              </div>
                              <FormControl className="flex-1">
                                <Textarea
                                  {...field}
                                  className="min-h-15 rounded-md border-border/50 bg-background shadow-none text-[13px] py-2 resize-y"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all border sm:border-none"
                                onClick={() => pra.remove(idx)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* III. FAKTA */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                      III. FAKTA YANG MEMENGARUHI
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 sm:h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-sky-500 text-primary bg-white px-3 w-full sm:w-auto shadow-none"
                      onClick={() => setPresetOpen('fakta' as any)}>
                      <Zap className="w-3 h-3 mr-1.5" /> Preset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 sm:h-7 rounded-md text-[10px] border-border/60 shadow-none px-3 w-full sm:w-auto"
                      onClick={() => fak.append({ value: '' })}>
                      <Plus className="w-3 h-3 mr-1.5" /> Tambah Poin
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {fak.fields.length === 0 ? (
                    <div className="p-4 text-center border border-dashed rounded-md text-xs text-muted-foreground">
                      Klik &quot;Tambah Poin&quot; atau &quot;Preset&quot; untuk mengisi fakta.
                    </div>
                  ) : (
                    fak.fields.map((f, idx) => (
                      <FormField
                        key={f.id}
                        control={form.control}
                        name={`fakta.${idx}.value`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <div className="flex gap-2 group items-start">
                              <div className="h-9 w-9 shrink-0 flex items-center justify-center text-[10px] font-mono border border-border/40 rounded-md bg-muted/20 text-muted-foreground">
                                {idx + 1}
                              </div>
                              <FormControl className="flex-1">
                                <Textarea
                                  {...field}
                                  className="min-h-15 rounded-md border-border/50 bg-background shadow-none text-[13px] py-2 resize-y"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all border sm:border-none"
                                onClick={() => fak.remove(idx)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))
                  )}
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* IV & V: ANALISIS & KESIMPULAN */}
              <div className="grid gap-8 grid-cols-1 md:grid-cols-2 items-start">
                <FormField
                  control={form.control}
                  name="analisis"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <MessageSquareText className="w-3.5 h-3.5 text-muted-foreground" />
                          <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                            IV. ANALISIS
                          </FormLabel>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 sm:h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-sky-500 text-primary bg-white px-3 w-full sm:w-auto shadow-none"
                          onClick={() => setPresetOpen('analisis' as any)}>
                          <Zap className="w-3 h-3 mr-1.5" /> Preset
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          rows={5}
                          className="rounded-md border-border/50 bg-background shadow-none text-sm p-3"
                          placeholder="Masukan kalimat analisis atau lihat preset"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kesimpulan"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <MessageSquareText className="w-3.5 h-3.5 text-muted-foreground" />
                          <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                            V. KESIMPULAN
                          </FormLabel>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 sm:h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-sky-500 text-primary bg-white px-3 w-full sm:w-auto shadow-none"
                          onClick={() => setPresetOpen('kesimpulan' as any)}>
                          <Zap className="w-3 h-3 mr-1.5" /> Preset
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          rows={5}
                          className="rounded-md border-border/50 bg-background shadow-none text-sm p-3"
                          placeholder="Masukan kesimpulan atau lihat preset"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* VI. SARAN */}
              <FormField
                control={form.control}
                name="saran"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MessageSquareText className="w-3.5 h-3.5 text-muted-foreground" />
                        <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                          VI. SARAN DAN TINDAKAN
                        </FormLabel>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 sm:h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-sky-500 text-primary bg-white px-3 w-full sm:w-auto shadow-none"
                        onClick={() => setPresetOpen('saran' as any)}>
                        <Zap className="w-3 h-3 mr-1.5" /> Preset
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        rows={4}
                        className="rounded-md border-border/50 bg-background shadow-none text-sm p-3"
                        placeholder="Masukan kalimat saran atau kalimat pembuka. Bisa juga meluhat preset"
                      />
                    </FormControl>
                    <FormDescription className="text-[12px] text-muted-foreground/90">
                      *Daftar pegawai ikut dinas akan ditambahkan secara otomatis pada file PDF sesuai roster personel.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted/10 border border-border/30 rounded-lg p-4 sm:p-6">
                <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Personel Terkait Dokumen
                </div>
                {roster.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Belum ada personel diatur dalam roster.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {roster.map((r) => (
                      <Badge
                        key={r.id}
                        variant="secondary"
                        className="bg-background tracking-wider border-border/50 text-xs sm:text-sm font-medium py-1 px-3">
                        {r.nama}{' '}
                        {r.role === 'KEPALA_JALAN' && <Crown className="w-3 h-3 ml-2 text-primary fill-primary/10" />}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-8 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-10 font-medium text-muted-foreground hover:text-foreground w-full sm:w-auto "
                  onClick={() => window.open(`/spj/${spjId}/telaahan/print`, '_blank')}>
                  <Printer className="w-3.5 h-3.5 mr-2" /> Preview PDF
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-8 rounded-md bg-foreground text-background hover:bg-foreground/90 shadow-sm transition-all w-full sm:w-auto">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Simpan Telaahan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* RENDER SEMUA MODAL PRESET PICKER */}
      {(['dasar', 'analisis', 'kesimpulan', 'saran', 'praAnggapan', 'fakta'] as const).map((key) => (
        <PresetPicker
          key={key}
          open={presetOpen === key}
          onOpenChange={(v) => setPresetOpen(v ? key : null)}
          title={`Preset ${key.charAt(0).toUpperCase() + key.slice(1)}`}
          description={key === 'dasar' ? 'Pilih template rujukan regulasi/dasar untuk telaahan Anda.' : undefined}
          items={[...(PRESETS[key as PresetKey] || [])]}
          onPick={(text) =>
            key === 'praAnggapan' || key === 'fakta'
              ? appendPresetToArray(key === 'praAnggapan' ? pra : fak, text)
              : applyPreset(key, text)
          }
        />
      ))}
    </div>
  )
}
