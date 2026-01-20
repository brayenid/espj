/* eslint-disable react-hooks/purity */
'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, ExternalLink, Loader2 } from 'lucide-react'

export type PdfDocItem = {
  key: string
  label: string
  url: string
}

export default function PdfPreviewDialog({
  open,
  onOpenChange,
  title,
  description,
  url
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: string
  url: string | null
}) {
  const [isPrinting, setIsPrinting] = React.useState(false)
  const printFrameRef = React.useRef<HTMLIFrameElement>(null)

  // cache-bust biar kalau habis edit data, preview tidak “nempel” PDF lama
  const src = React.useMemo(() => {
    if (!url) return null
    const u = new URL(url, window.location.origin)
    u.searchParams.set('_t', String(Date.now()))
    return u.toString()
  }, [url])

  // Fungsi Cetak Langsung
  const handlePrint = () => {
    if (!src || !printFrameRef.current) return

    setIsPrinting(true)
    const frame = printFrameRef.current

    // Set src ke iframe tersembunyi
    frame.src = src

    // Tunggu load selesai baru cetak
    frame.onload = () => {
      try {
        frame.contentWindow?.focus()
        frame.contentWindow?.print()
      } catch (e) {
        console.error('Gagal mencetak:', e)
      } finally {
        setIsPrinting(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-7xl max-h-[90vh] overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="truncate">{title}</DialogTitle>
              {description ? <DialogDescription className="mt-1">{description}</DialogDescription> : null}
            </div>

            {url ? (
              <div className="flex shrink-0 items-center gap-2 mr-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 shadow-none"
                  disabled={isPrinting}
                  onClick={handlePrint}>
                  {isPrinting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4 mr-2" />
                  )}
                  Cetak
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-xl h-9 shadow-none"
                  onClick={() => window.open(url, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka
                </Button>
              </div>
            ) : null}
          </div>
        </DialogHeader>

        <div className="h-[78vh] bg-muted">
          {src ? (
            <iframe title={title} src={src} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Tidak ada PDF untuk ditampilkan.
            </div>
          )}
        </div>

        {/* Iframe Tersembunyi untuk Proses Cetak */}
        <iframe
          ref={printFrameRef}
          style={{ position: 'absolute', width: 0, height: 0, border: 0, visibility: 'hidden' }}
          title="Print Frame"
        />
      </DialogContent>
    </Dialog>
  )
}
