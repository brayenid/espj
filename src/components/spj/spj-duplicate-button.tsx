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
import { cn } from '@/lib/utils'

export default function SpjDuplicateButton({ id, className }: { id: string; className?: string }) {
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
          variant="outline"
          size="sm"
          // Mencegah navigasi baris tabel saat tombol diklik
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'h-8 px-3 rounded-md border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2 cursor-pointer shadow-none',
            className
          )}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
          <span className="text-[10px] font-bold uppercase tracking-wider">Duplikat</span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent
        className="rounded-2xl max-w-100 border-border/40 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Copy className="w-5 h-5 text-primary" />
            </div>
            <AlertDialogTitle className="text-lg font-bold tracking-tight uppercase">
              Duplikat Data SPJ
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Seluruh metadata, personil, rincian biaya, dan isi laporan akan diduplikasi ke draf baru.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel className="rounded-xl h-10 font-bold text-[10px] tracking-widest uppercase border-border/60">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleCopy()
            }}
            disabled={isPending}
            className="rounded-xl h-10 px-6 font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-primary/10">
            {isPending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-2" /> Memproses...
              </>
            ) : (
              'Duplikat Sekarang'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
