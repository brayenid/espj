/* eslint-disable react-hooks/purity */
'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
  // cache-bust biar kalau habis edit data, preview tidak “nempel” PDF lama
  const src = React.useMemo(() => {
    if (!url) return null
    const u = new URL(url, window.location.origin)
    u.searchParams.set('_t', String(Date.now()))
    return u.toString()
  }, [url])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl p-0">
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
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => window.open(url, '_blank')}>
                  Buka Tab Baru
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
      </DialogContent>
    </Dialog>
  )
}
