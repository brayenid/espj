'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

// Perbaikan Skema: Menggunakan .transform atau cara yang lebih eksplisit untuk sinkronisasi tipe
const schema = z.object({
  buktiDukungUrl: z
    .string()
    .trim()
    .nullable()
    .or(z.literal('')) // Mengizinkan string kosong
    .transform((v) => (v === '' || v === null ? null : v)) // Ubah string kosong jadi null
    .pipe(z.string().url('URL tidak valid. Contoh: https://...').nullable())
})

type FormValues = z.infer<typeof schema>

export default function BuktiDukungForm({ spjId, initialUrl }: { spjId: string; initialUrl: string | null }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const defaultValues = useMemo<FormValues>(() => {
    return { buktiDukungUrl: initialUrl ?? null }
  }, [initialUrl])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })

  // Memantau nilai URL untuk tombol "Buka Link"
  const urlValue = form.watch('buktiDukungUrl')

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const res = await fetch(`/api/spj/${spjId}/bukti-dukung`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      if (!res.ok) {
        toast.error('Gagal menyimpan Bukti Dukung URL.')
        return
      }

      toast.success('Bukti Dukung URL tersimpan.')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Bukti Dukung</CardTitle>
        <p className="text-sm text-muted-foreground">Masukkan link Drive/Dropbox/Website sebagai bukti dukung.</p>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="buktiDukungUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Bukti Dukung</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      // Memastikan value tidak pernah null di level HTML Input (karena Input tidak suka null)
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="https://drive.google.com/…"
                      className="rounded-2xl"
                      inputMode="url"
                    />
                  </FormControl>
                  <FormDescription>Kosongkan jika tidak ada. Jika diisi, wajib format URL valid.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="rounded-2xl"
                // Tombol aktif jika ada input teks
                disabled={!urlValue}
                onClick={() => {
                  if (urlValue) window.open(urlValue, '_blank')
                }}>
                Buka Link
              </Button>

              <Button type="submit" disabled={saving} className="rounded-2xl">
                {saving ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
