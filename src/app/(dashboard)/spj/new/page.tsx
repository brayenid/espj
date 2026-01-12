import SpjCreateForm from '@/components/spj/spj-create-form'
import { Separator } from '@/components/ui/separator'
import { FilePlus2 } from 'lucide-react'

export default function SpjNewPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-12">
      <div className="space-y-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-muted/30 mb-2">
          <FilePlus2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-medium tracking-tight">Buat SPJ Baru</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Lengkapi detail perjalanan dinas di bawah ini. Anda dapat mengupdate nomor surat dan detail lainnya nanti.
        </p>
      </div>

      <Separator className="bg-border/50" />

      <div className="relative">
        {/* Decorative subtle glow ala Linear */}
        <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/50 via-border to-transparent opacity-50" />

        <div className="pl-6">
          <SpjCreateForm />
        </div>
      </div>
    </div>
  )
}
