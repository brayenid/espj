/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
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
  Zap
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
  saran: z.string().optional().nullable()
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden rounded-lg border-border/50 p-0 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/40 bg-muted/20">
          <DialogTitle className="text-sm font-semibold tracking-tight">{title}</DialogTitle>
          {description ? <DialogDescription className="text-[12px] mt-1">{description}</DialogDescription> : null}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
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
                  className="group w-full rounded-md border border-border/40 bg-background p-4 text-left transition-all hover:bg-muted/30 hover:border-border focus:ring-1 focus:ring-ring"
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
                    <Badge
                      variant="outline"
                      className="h-6 text-[9px] uppercase tracking-tighter opacity-50 group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
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
      saran: initial?.saran ?? ''
    }
  }, [initial, initialSpj])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })

  const pra = useFieldArray({ control: form.control, name: 'praAnggapan' })
  const fak = useFieldArray({ control: form.control, name: 'fakta' })

  // Fungsi untuk text area biasa (replace value)
  function applyPreset(key: PresetKey, text: string) {
    form.setValue(key as any, text, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setPresetOpen(null)
  }

  // Fungsi khusus untuk array (append value)
  function appendPresetToArray(arrayHelper: any, text: string) {
    arrayHelper.append({ value: text })
    setPresetOpen(null)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const payload = {
        ...values,
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

  const kepala = roster.find((r) => r.role === 'KEPALA_JALAN')

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="rounded-lg border-border/50 bg-card/40 shadow-none overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/10 px-6 py-5">
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

        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
              {/* Meta Section */}
              <div className="grid gap-6 md:grid-cols-3 bg-muted/10 p-5 rounded-lg border border-border/30">
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
                          className="h-9 rounded-md border-border/50 bg-background shadow-xs text-xs"
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
                          className="h-9 rounded-md border-border/50 bg-background shadow-xs text-xs"
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
                          className="h-9 rounded-md border-border/50 bg-background shadow-xs text-xs"
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
                        rows={2}
                        className="rounded-md border-border/50 bg-background shadow-xs text-[13px] font-medium resize-none focus-visible:ring-1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="bg-border/40" />

              {/* Dasar Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="dasar"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center justify-between">
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
                          className="h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-primary/50 text-primary bg-primary/5 px-3"
                          onClick={() => setPresetOpen('dasar')}>
                          <Zap className="w-3 h-3 mr-1.5" /> Preset
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          rows={6}
                          className="rounded-md border-border/50 bg-background shadow-xs text-sm leading-relaxed p-4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pra-anggapan Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                      II. PRA-ANGGAPAN
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* NEW: Tombol Preset untuk Pra-anggapan */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-primary/50 text-primary bg-primary/5 px-3"
                      onClick={() => setPresetOpen('praAnggapan' as any)}>
                      <Zap className="w-3 h-3 mr-1.5" /> Preset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-md text-[10px] border-border/60 shadow-xs px-3"
                      onClick={() => pra.append({ value: '' })}>
                      <Plus className="w-3 h-3 mr-1.5" /> Tambah Poin
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {pra.fields.length === 0 ? (
                    <div className="p-4 text-center border border-dashed rounded-md text-xs text-muted-foreground italic">
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
                            <div className="flex gap-2 group">
                              <div className="h-9 w-9 flex items-center justify-center text-[10px] font-mono border border-border/40 rounded-md bg-muted/20 text-muted-foreground">
                                {idx + 1}
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-9 rounded-md border-border/50 bg-background shadow-xs text-[13px]"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
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

              {/* Fakta Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                      III. FAKTA YANG MEMENGARUHI
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* NEW: Tombol Preset untuk Fakta */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-primary/50 text-primary bg-primary/5 px-3"
                      onClick={() => setPresetOpen('fakta' as any)}>
                      <Zap className="w-3 h-3 mr-1.5" /> Preset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-md text-[10px] border-border/60 shadow-xs px-3"
                      onClick={() => fak.append({ value: '' })}>
                      <Plus className="w-3 h-3 mr-1.5" /> Tambah Poin
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {fak.fields.length === 0 ? (
                    <div className="p-4 text-center border border-dashed rounded-md text-xs text-muted-foreground italic">
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
                            <div className="flex gap-2 group">
                              <div className="h-9 w-9 flex items-center justify-center text-[10px] font-mono border border-border/40 rounded-md bg-muted/20 text-muted-foreground">
                                {idx + 1}
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-9 rounded-md border-border/50 bg-background shadow-xs text-[13px]"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
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

              {/* Analisis & Kesimpulan Section */}
              <div className="grid gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="analisis"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center justify-between">
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
                          className="h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-primary/50 text-primary bg-primary/5 px-3"
                          onClick={() => setPresetOpen('analisis' as any)}>
                          <Zap className="w-3 h-3 mr-1.5" /> Preset
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          rows={5}
                          className="rounded-md border-border/50 bg-background shadow-xs text-sm p-3"
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
                      <div className="flex items-center justify-between">
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
                          className="h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-primary/50 text-primary bg-primary/5 px-3"
                          onClick={() => setPresetOpen('kesimpulan' as any)}>
                          <Zap className="w-3 h-3 mr-1.5" /> Preset
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          rows={5}
                          className="rounded-md border-border/50 bg-background shadow-xs text-sm p-3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Saran Section */}
              <FormField
                control={form.control}
                name="saran"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center justify-between">
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
                        className="h-7 rounded-md text-[10px] font-bold border-primary/20 hover:border-primary/50 text-primary bg-primary/5 px-3"
                        onClick={() => setPresetOpen('saran' as any)}>
                        <Zap className="w-3 h-3 mr-1.5" /> Preset
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        rows={4}
                        className="rounded-md border-border/50 bg-background shadow-xs text-sm p-3"
                      />
                    </FormControl>
                    <FormDescription className="text-[12px] text-muted-foreground/90">
                      *Daftar pegawai ikut dinas akan ditambahkan secara otomatis pada file PDF sesuai roster personel.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Roster Preview */}
              <div className="bg-muted/10 border border-border/30 rounded-lg p-6">
                <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
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
                        className="bg-background border-border/50 text-[11px] font-medium py-1 px-3">
                        {r.nama}{' '}
                        {r.role === 'KEPALA_JALAN' && <Crown className="w-3 h-3 ml-2 text-primary fill-primary/10" />}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-4 pt-8 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => window.open(`/spj/${spjId}/telaahan/print`, '_blank')}>
                  <Printer className="w-3.5 h-3.5 mr-2" /> PREVIEW PDF
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-8 rounded-md bg-foreground text-background hover:bg-foreground/90 shadow-sm transition-all">
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

      {/* Preset Modals */}
      <PresetPicker
        open={presetOpen === 'dasar'}
        onOpenChange={(v) => setPresetOpen(v ? 'dasar' : null)}
        title="Preset Dasar"
        description="Pilih template rujukan regulasi/dasar untuk telaahan Anda."
        items={[...PRESETS.dasar]}
        onPick={(text) => applyPreset('dasar', text)}
      />

      <PresetPicker
        open={presetOpen === 'analisis'}
        onOpenChange={(v) => setPresetOpen(v ? 'analisis' : null)}
        title="Preset Analisis Staf"
        items={[...PRESETS.analisis]}
        onPick={(text) => applyPreset('analisis', text)}
      />

      <PresetPicker
        open={presetOpen === 'kesimpulan'}
        onOpenChange={(v) => setPresetOpen(v ? 'kesimpulan' : null)}
        title="Preset Kesimpulan Akhir"
        items={[...PRESETS.kesimpulan]}
        onPick={(text) => applyPreset('kesimpulan', text)}
      />

      <PresetPicker
        open={presetOpen === 'saran'}
        onOpenChange={(v) => setPresetOpen(v ? 'saran' : null)}
        title="Preset Saran & Tindakan"
        items={[...PRESETS.saran]}
        onPick={(text) => applyPreset('saran', text)}
      />

      {/* NEW: Preset Modals untuk Pra-anggapan & Fakta (Menggunakan appendPresetToArray) */}
      {/* Menggunakan 'as any' karena tipe PresetKey di TS mungkin belum update jika JSON belum di-save */}
      <PresetPicker
        open={presetOpen === ('praAnggapan' as any)}
        onOpenChange={(v) => setPresetOpen(v ? ('praAnggapan' as any) : null)}
        title="Preset Pra-anggapan"
        description="Pilih poin untuk ditambahkan ke daftar Pra-anggapan."
        items={PRESETS['praAnggapan' as keyof typeof PRESETS] || []}
        onPick={(text) => appendPresetToArray(pra, text)}
      />

      <PresetPicker
        open={presetOpen === ('fakta' as any)}
        onOpenChange={(v) => setPresetOpen(v ? ('fakta' as any) : null)}
        title="Preset Fakta"
        description="Pilih poin untuk ditambahkan ke daftar Fakta."
        items={PRESETS['fakta' as keyof typeof PRESETS] || []}
        onPick={(text) => appendPresetToArray(fak, text)}
      />
    </div>
  )
}
