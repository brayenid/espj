'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { duplicateSpj } from '@/server/spj/mutations'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

export default function SpjDuplicateButton({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleCopy = () => {
    startTransition(async () => {
      const res = await duplicateSpj(id)
      if (res.ok) {
        toast.success('SPJ berhasil disalin sebagai draf baru')
        setOpen(false)
        router.push(`/spj/${res.id}`)
      } else {
        toast.error(res.message || 'Gagal menyalin SPJ')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary hover:bg-primary/10"
          title="Salin SPJ">
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-2xl max-w-[400px] border-border/40 shadow-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Copy className="w-5 h-5 text-primary" />
            </div>
            <AlertDialogTitle className="text-lg font-bold tracking-tight uppercase">Salin Data SPJ</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Seluruh metadata, personil (roster), rincian biaya, dan isi laporan akan diduplikasi ke draf baru. Nomor
            surat akan dikosongkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel className="rounded-xl h-10 font-bold text-[10px] tracking-widest uppercase border-border/60">
            BATAL
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault() // Mencegah penutupan otomatis sebelum async selesai
              handleCopy()
            }}
            disabled={isPending}
            className="rounded-xl h-10 px-6 font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-primary/10">
            {isPending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-2" /> MEMPROSES...
              </>
            ) : (
              'YA, SALIN SEKARANG'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
