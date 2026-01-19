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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { Loader2, Save, Link2, Landmark, ClipboardList, CalendarDays } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
    tempatTujuan: z.string(),
    pencairan: z.boolean(),
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
    tempatTujuan: string
    pencairan: boolean
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
      tempatTujuan: initial.tempatTujuan ?? null,
      pencairan: initial.pencairan ?? false,
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

  const MASTER_KEGIATAN = [
    { kode: '4.01.01.2.13', judul: 'Penataan Organisasi' },
    { kode: '4.01.01.2.06', judul: 'Administrasi Kepegawaian' }
  ]

  const MASTER_SUB_KEGIATAN = [
    { kode: '4.01.01.2.13.0002', judul: 'Fasilitasi Pelayanan Publik dan Tata Laksana' },
    {
      kode: '4.01.01.2.13.0004',
      judul: 'Monitoring, Evaluasi, dan Pengendalian Kualitas Pelayanan Publik dan Tata Laksana'
    }
  ]

  const REKENING_OPTIONS = [
    { kode: '5.1.02.04.001.00001', judul: 'Belanja Perjalanan Dinas Biasa' },
    { kode: '5.1.02.04.001.00003', judul: 'Belanja Perjalanan Dinas Dalam Kota' }
  ]

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

          <div className="grid gap-4 md:grid-cols-1">
            <FormField
              control={form.control}
              name="tempatTujuan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-muted-foreground">Tempat Tujuan</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border-border/50 bg-background/50 h-9"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Misal: Samarinda"
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

          <div className="space-y-6">
            {/* BARIS KEGIATAN */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="kodeKegiatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] text-muted-foreground">Kode Kegiatan</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val)
                        // OTOMATISASI: Cari judul berdasarkan kode yang dipilih
                        const matched = MASTER_KEGIATAN.find((k) => k.kode === val)
                        if (matched) form.setValue('judulKegiatan', matched.judul)
                      }}
                      defaultValue={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger className="w-full rounded-md border-border/50 bg-background/50 h-9 text-[14px] overflow-hidden">
                          <SelectValue placeholder="Pilih Kode Kegiatan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-w-(--radix-select-trigger-width)">
                        {MASTER_KEGIATAN.map((k) => (
                          <SelectItem key={k.kode} value={k.kode} className="text-[13px]">
                            {k.kode} - {k.judul}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Judul Kegiatan menjadi Read-only atau Informatif */}
              <FormField
                control={form.control}
                name="judulKegiatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] text-muted-foreground">Judul Kegiatan</FormLabel>
                    <FormControl>
                      <div className="flex h-9 w-full items-center rounded-md border border-border/50 bg-muted/30 px-3 py-1 text-[13px] text-muted-foreground truncate">
                        {field.value || 'Pilih kode untuk mengisi judul...'}
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* BARIS SUB KEGIATAN */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="kodeSubKegiatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] text-muted-foreground">Kode Sub Kegiatan</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val)
                        // OTOMATISASI: Cari judul sub-kegiatan
                        const matched = MASTER_SUB_KEGIATAN.find((sk) => sk.kode === val)
                        if (matched) form.setValue('judulSubKegiatan', matched.judul)
                      }}
                      defaultValue={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger className="w-full rounded-md border-border/50 bg-background/50 h-9 text-[14px] overflow-hidden">
                          <SelectValue placeholder="Pilih Kode Sub Kegiatan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-w-(--radix-select-trigger-width)">
                        {MASTER_SUB_KEGIATAN.map((sk) => (
                          <SelectItem key={sk.kode} value={sk.kode} className="text-[13px]">
                            {sk.kode} - {sk.judul}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <div className="flex h-9 w-full items-center rounded-md border border-border/50 bg-muted/30 px-3 py-1 text-[13px] text-muted-foreground truncate">
                        {field.value || 'Pilih kode sub-kegiatan...'}
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            </div>
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
                <FormItem className="w-full">
                  <FormLabel className="text-[13px] text-muted-foreground">Kode Rekening</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      // Automatisasi: Update judulRekening saat kode dipilih
                      const matched = REKENING_OPTIONS.find((opt) => opt.kode === val)
                      if (matched) form.setValue('judulRekening', matched.judul)
                    }}
                    defaultValue={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger className="w-full rounded-md border-border/50 bg-background/50 h-9 text-[14px] overflow-hidden focus:ring-1">
                        <div className="truncate text-left">
                          <SelectValue placeholder="Pilih Kode Rekening" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[100] rounded-xl border-border/50 shadow-xl bg-background max-w-(--radix-select-trigger-width)">
                      {REKENING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.kode} value={opt.kode} className="py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[12px] text-foreground leading-none">{opt.kode}</span>
                            <span className="text-[10px] text-muted-foreground truncate opacity-80">{opt.judul}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="judulRekening"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-[13px] text-muted-foreground">Judul Rekening</FormLabel>
                <FormControl>
                  {/* Tampilan Read-only yang konsisten dengan desain modern Anda */}
                  <div className="flex h-9 w-full items-center rounded-md border border-border/50 bg-muted/30 px-3 py-1 text-[13px] text-muted-foreground truncate">
                    {field.value || 'Judul akan terisi otomatis...'}
                  </div>
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

          <FormField
            control={form.control}
            name="pencairan"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 bg-background/50 p-4 shadow-sm transition-colors hover:bg-muted/20">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-5 w-5 rounded-md border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-[13px] font-bold uppercase tracking-wider text-foreground cursor-pointer">
                    Status Pencairan
                  </FormLabel>
                  <FormDescription className="text-[11px] text-muted-foreground">
                    Centang jika dana SPJ ini sudah dicairkan oleh bendahara.
                  </FormDescription>
                </div>
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
