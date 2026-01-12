/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Grid3X3, Loader2, Printer, Save } from 'lucide-react'

const schema = z.object({
  stageCount: z.coerce
    .number({ error: 'Wajib berupa angka' })
    .int()
    .min(1, 'Minimal 1 tahap')
    .max(12, 'Maksimal 12 tahap')
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export default function VisumForm({ spjId, initialStageCount }: { spjId: string; initialStageCount: number }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const defaultValues = useMemo<FormInput>(() => {
    return { stageCount: initialStageCount || 4 }
  }, [initialStageCount])

  const form = useForm<FormInput, any, FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const res = await fetch(`/api/spj/${spjId}/visum`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      if (!res.ok) throw new Error()
      toast.success('Pengaturan VISUM tersimpan.')
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <Card className="rounded-xl border-border/40 shadow-none">
        <CardHeader className="border-b border-border/40 px-6 py-5 bg-muted/5">
          <div className="flex items-center gap-3">
            <Grid3X3 className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Lembar Visum</CardTitle>
              <p className="text-[11px] text-muted-foreground font-medium uppercase mt-0.5 tracking-wider">
                Pengaturan Kolom Stempel & Paraf
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="stageCount"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Jumlah Tahap (Penandatangan di Tempat Tujuan)
                    </FormLabel>
                    <FormControl>
                      <Input
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        inputMode="numeric"
                        className="rounded-2xl w-40"
                        placeholder="Contoh: 4"
                        value={field.value == null ? '' : String(field.value)}
                        onChange={(e) => field.onChange(e.target.value)} // ✅ biar coerce jalan
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Tentukan jumlah kolom visum yang akan muncul di PDF (Umumnya 4 tahap).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-border/40 pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 px-6 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => window.open(`/spj/${spjId}/visum/print`, '_blank')}>
                  <Printer className="w-4 h-4 mr-2" /> PREVIEW PDF
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 px-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-xs shadow-sm transition-all">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> MENYIMPAN...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> SIMPAN
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
