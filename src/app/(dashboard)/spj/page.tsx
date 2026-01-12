import Link from 'next/link'
import { redirect } from 'next/navigation'

import { listSpjForCurrentUser } from '@/server/spj/queries'
import { prisma } from '@/lib/prisma'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

import SpjSearchBar from '@/components/spj/spj-search-bar'
import { ArrowLeft, ArrowRight, ChevronRight, FileText, Plus, User2Icon, UserCircle } from 'lucide-react'

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function safe(s?: string | null, fb = '-') {
  const t = (s ?? '').trim()
  return t.length ? t : fb
}

function buildQueryString(base: Record<string, string | undefined | null>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(base)) {
    if (v == null) continue
    const vv = String(v).trim()
    if (!vv) continue
    q.set(k, vv)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

type SearchParams = Promise<{ q?: string; page?: string }>

export default async function SpjListPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const qRaw = (sp.q ?? '').trim()
  const pageRaw = (sp.page ?? '1').trim()

  const pageNum = Number.isFinite(Number(pageRaw)) ? Math.max(1, Math.floor(Number(pageRaw))) : 1
  const pageSize = 10

  const items = await listSpjForCurrentUser()

  const filtered = qRaw
    ? items.filter((x) => {
        const hay = [
          x.tempatTujuan,
          x.noSuratTugas ?? '',
          x.noSpd ?? '',
          fmtDate(x.tglBerangkat),
          fmtDate(x.tglKembali)
        ]
          .join(' ')
          .toLowerCase()

        return hay.includes(qRaw.toLowerCase())
      })
    : items

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (pageNum > totalPages && totalPages > 0) {
    redirect(buildQueryString({ q: qRaw, page: String(totalPages) }) || '?page=1')
  }

  const start = (pageNum - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  const ids = pageItems.map((x) => x.id)
  const rosterRows = ids.length
    ? await prisma.spjRosterItem.findMany({
        where: { spjId: { in: ids } },
        orderBy: [{ spjId: 'asc' }, { role: 'asc' }, { order: 'asc' }],
        select: { spjId: true, role: true, order: true, nama: true }
      })
    : []

  const rosterPreview = new Map<string, string>()
  for (const id of ids) {
    const rows = rosterRows.filter((r) => r.spjId === id)
    if (rows.length === 0) {
      rosterPreview.set(id, '-')
      continue
    }

    const kepala = rows.find((r) => r.role === 'KEPALA_JALAN') ?? rows[0]
    const pengikutCount = rows.filter((r) => r.role === 'PENGIKUT').length

    rosterPreview.set(id, pengikutCount > 0 ? `${kepala.nama} + ${pengikutCount} orang` : `${kepala.nama}`)
  }

  const prevHref = buildQueryString({ q: qRaw, page: String(Math.max(1, pageNum - 1)) })
  const nextHref = buildQueryString({ q: qRaw, page: String(Math.min(totalPages, pageNum + 1)) })

  const windowSize = 5
  const half = Math.floor(windowSize / 2)
  const pStart = Math.max(1, pageNum - half)
  const pEnd = Math.min(totalPages, pStart + windowSize - 1)
  const pStart2 = Math.max(1, pEnd - windowSize + 1)
  const pages = Array.from({ length: pEnd - pStart2 + 1 }).map((_, i) => pStart2 + i)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4">
      {/* Header Linear Style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-medium tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            Surat Perjalanan Dinas
          </h1>
          <p className="text-sm text-muted-foreground/80">Manajemen dan monitoring pembuatan dokumen SPJ Anda.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="h-9 bg-foreground text-background hover:bg-foreground/90 shadow-sm">
            <Link href="/spj/new">
              <Plus className="mr-2 h-4 w-4" />
              Buat SPJ
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Action Bar (Search & Stats) */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full max-w-md">
            <SpjSearchBar initialQ={qRaw} />
          </div>
          <div className="text-[13px] text-muted-foreground tabular-nums bg-muted/30 px-3 py-1 rounded-full border border-border/40">
            Total: <span className="font-medium text-foreground">{total}</span> entri
          </div>
        </div>
      </div>

      {/* Linear Style Table Container */}
      <div className="rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="py-3 font-medium text-foreground">Tujuan</TableHead>
              <TableHead className="hidden md:table-cell py-3 font-medium text-foreground">Pelaksana</TableHead>
              <TableHead className="py-3 font-medium text-foreground">Periode</TableHead>
              <TableHead className="hidden lg:table-cell py-3 font-medium text-foreground">No. Surat</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {qRaw ? `Tidak ada hasil untuk "${qRaw}"` : 'Belum ada data perjalanan dinas.'}
                    </p>
                    <Button variant="link" asChild className="text-xs">
                      <Link href="/spj/new">Mulai buat sekarang</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((spj) => (
                <TableRow key={spj.id} className="group border-border/40 transition-colors hover:bg-muted/20">
                  <TableCell className="py-4">
                    <div className="font-medium text-[14px]">{spj.tempatTujuan}</div>
                    <div className="text-xs text-muted-foreground lg:hidden mt-1">{safe(spj.noSuratTugas)}</div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell py-4">
                    <span className="text-sm text-muted-foreground/90">{safe(rosterPreview.get(spj.id))}</span>
                  </TableCell>

                  <TableCell className="py-4 tabular-nums text-sm">
                    <div className="flex flex-col">
                      <span>{fmtDate(spj.tglBerangkat)}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
                        s/d
                      </span>
                      <span>{fmtDate(spj.tglKembali)}</span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell py-4 text-sm text-muted-foreground font-mono">
                    {safe(spj.noSuratTugas)}
                  </TableCell>

                  <TableCell className="text-right py-4">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/spj/${spj.id}`}>
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Buka</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20">
          <div className="text-xs text-muted-foreground">
            Halaman <span className="text-foreground font-medium">{pageNum}</span> dari{' '}
            <span className="text-foreground font-medium">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button asChild variant="outline" size="icon" className="h-8 w-8 border-border/60" disabled={pageNum <= 1}>
              <Link
                href={pageNum <= 1 ? '#' : prevHref || '?page=1'}
                className={pageNum <= 1 ? 'pointer-events-none' : ''}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </Button>

            <div className="flex items-center gap-1 mx-1">
              {pages.map((p) => (
                <Link
                  key={p}
                  href={buildQueryString({ q: qRaw, page: String(p) }) || `?page=${p}`}
                  className={`text-xs w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                    p === pageNum
                      ? 'bg-foreground text-background font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  {p}
                </Link>
              ))}
            </div>

            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border/60"
              disabled={pageNum >= totalPages}>
              <Link
                href={pageNum >= totalPages ? '#' : nextHref || `?page=${totalPages}`}
                className={pageNum >= totalPages ? 'pointer-events-none' : ''}>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
