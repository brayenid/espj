'use client'

import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { Loader2, Save, Link2, FileText, Landmark, ClipboardList, CalendarDays, ArrowRight } from 'lucide-react'

// QA: Validasi Cross-Field untuk rentang tanggal
const schema = z
  .object({
    noTelaahan: z.string().trim().nullable(),
    noSuratTugas: z.string().trim().nullable(),
    noSpd: z.string().trim().nullable(),

    tahunAnggaran: z.string().trim().nullable(),
    kodeKegiatan: z.string().trim().nullable(),
    judulKegiatan: z.string().trim().nullable(),
    kodeSubKegiatan: z.string().trim().nullable(),
    judulSubKegiatan: z.string().trim().nullable(),
    upGu: z.string().trim().nullable(),
    nomorBku: z.string().trim().nullable(),
    kodeRekening: z.string().trim().nullable(),
    judulRekening: z.string().trim().nullable(),
    akunAnggaran: z.string().trim().nullable(),

    buktiDukungUrl: z.optional(z.string()),

    maksudDinas: z.string().trim().nullable(),
    tingkatPerjalanan: z.optional(z.string().trim().nullable()),

    // Field Baru
    tglBerangkat: z.date({ error: 'Tanggal berangkat wajib diisi' }),
    tglKembali: z.date({ error: 'Tanggal kembali wajib diisi' })
  })
  .refine((data) => data.tglKembali >= data.tglBerangkat, {
    message: 'Tanggal kembali tidak boleh sebelum tanggal berangkat',
    path: ['tglKembali'] // Error akan muncul di field tglKembali
  })

type FormValues = z.infer<typeof schema>

export default function SpjMetaForm({
  spjId,
  initial,
  onSaved
}: {
  spjId: string
  initial: {
    noTelaahan: string | null
    noSuratTugas: string | null
    noSpd: string | null
    tahunAnggaran: string | null
    kodeKegiatan: string | null
    judulKegiatan: string | null
    kodeSubKegiatan: string | null
    judulSubKegiatan: string | null
    upGu: string | null
    nomorBku: string | null
    kodeRekening: string | null
    judulRekening: string | null
    akunAnggaran: string | null
    buktiDukungUrl: string | null
    maksudDinas: string
    tingkatPerjalanan: string | null
    // Tambahan initial data
    tglBerangkat: Date | string
    tglKembali: Date | string
  }
  onSaved?: () => void
}) {
  const defaultValues = useMemo<FormValues>(() => {
    return {
      noTelaahan: initial.noTelaahan ?? null,
      noSuratTugas: initial.noSuratTugas ?? null,
      noSpd: initial.noSpd ?? null,
      tahunAnggaran: initial.tahunAnggaran ?? null,
      kodeKegiatan: initial.kodeKegiatan ?? null,
      judulKegiatan: initial.judulKegiatan ?? null,
      kodeSubKegiatan: initial.kodeSubKegiatan ?? null,
      judulSubKegiatan: initial.judulSubKegiatan ?? null,
      upGu: initial.upGu ?? null,
      nomorBku: initial.nomorBku ?? null,
      kodeRekening: initial.kodeRekening ?? null,
      judulRekening: initial.judulRekening ?? null,
      akunAnggaran: initial.akunAnggaran ?? null,
      buktiDukungUrl: initial.buktiDukungUrl ?? undefined,
      maksudDinas: initial.maksudDinas ?? null,
      tingkatPerjalanan: initial.tingkatPerjalanan ?? null,
      // Init dates
      tglBerangkat: new Date(initial.tglBerangkat),
      tglKembali: new Date(initial.tglKembali)
    }
  }, [initial])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })
  const [saving, setSaving] = useState(false)

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const res = await fetch(`/api/spj/${spjId}/meta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          tglBerangkat: values.tglBerangkat.toISOString(),
          tglKembali: values.tglKembali.toISOString()
        })
      })

      if (!res.ok) {
        toast.error('Gagal menyimpan data SPJ.')
        return
      }

      toast.success('Data SPJ tersimpan.')
      onSaved?.()
    } catch {
      toast.error('Terjadi kesalahan jaringan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* Section: Waktu & Penomoran */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <h4 className="text-[11px] font-bold uppercase tracking-widest">Waktu & Administrasi</h4>
          </div>

          {/* Date Range Row */}
          <div className="grid gap-4 md:grid-cols-2 bg-muted/20 p-4 rounded-xl border border-border/40">
            <FormField
              control={form.control}
              name="tglBerangkat"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[13px] text-muted-foreground">Tanggal Berangkat</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal h-10 rounded-lg border-border/50',
                            !field.value && 'text-muted-foreground'
                          )}>
                          {field.value ? format(field.value, 'PPP', { locale: localeId }) : <span>Pilih tanggal</span>}
                          <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tglKembali"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[13px] text-muted-foreground">Tanggal Kembali</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal h-10 rounded-lg border-border/50',
                            !field.value && 'text-muted-foreground'
                          )}>
                          {field.value ? format(field.value, 'PPP', { locale: localeId }) : <span>Pilih tanggal</span>}
                          <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="noTelaahan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">No Telaahan</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="800.1.1/............./I/2026"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="noSuratTugas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">No Surat Tugas</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="800.1.1/............./I/2026"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="noSpd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">No SPD</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="800.1.1/............./I/2026"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Section: Anggaran Dasar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Landmark className="w-4 h-4" />
            <h4 className="text-[11px] font-bold uppercase tracking-widest">Detail Anggaran & Kegiatan</h4>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="tahunAnggaran"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">Tahun Anggaran</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Contoh: 2025"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="akunAnggaran"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">Akun Anggaran</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Contoh: DPA SKPD Bagian Organisasi 2026"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="kodeKegiatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">Kode Kegiatan</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Contoh: 4.01.01.2.13"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="judulKegiatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">Judul Kegiatan</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Contoh: Penataan Organisasi"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="kodeSubKegiatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">Kode Sub Kegiatan</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Contoh: 4.01.01.2.13.0001"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="judulSubKegiatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">Judul Sub Kegiatan</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Contoh: Pengelolaan Tata Laksana"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="upGu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">UP/GU</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="UP / GU"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nomorBku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">Nomor BKU</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Nomor BKU"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kodeRekening"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">Kode Rekening</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Contoh: 5.1.02.04.01.0001"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="judulRekening"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] text-muted-foreground">Judul Rekening</FormLabel>
                <FormControl>
                  <Input
                    className="rounded-md border-border/50 bg-background/50 h-9"
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Contoh: Belanja Perjalanan Dinas Biasa"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tingkatPerjalanan"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] text-muted-foreground">Tingkat Perjalanan</FormLabel>
                <FormControl>
                  <Input
                    className="rounded-md border-border/50 bg-background/50 h-9"
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Tingkat Perjalanan Menurut Peraturan (PMK)"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
        </div>

        <Separator className="bg-border/40" />

        {/* Section: Konten Lainnya */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="w-4 h-4" />
            <h4 className="text-[11px] font-bold uppercase tracking-widest">Informasi Tambahan</h4>
          </div>
          <FormField
            control={form.control}
            name="buktiDukungUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" /> Bukti Dukung URL
                </FormLabel>
                <FormControl>
                  <Input
                    className="rounded-md border-border/50 bg-background/50 h-9 font-mono text-[12px]"
                    {...field}
                    value={field.value ?? ''}
                    placeholder="https://..."
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maksudDinas"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] text-muted-foreground">Maksud Dinas</FormLabel>
                <FormControl>
                  <Textarea
                    className="rounded-md border-border/50 bg-background/50 min-h-[100px] resize-none text-[14px]"
                    rows={4}
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Melakukan Konsultasi dan Koordinasi..."
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-border/40 gap-3">
          <Button
            type="submit"
            className="bg-foreground text-background hover:bg-foreground/90 h-9 px-8 rounded-md shadow-sm transition-all"
            disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
