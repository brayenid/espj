import Link from 'next/link'
import { redirect } from 'next/navigation'

// Asumsi: Fungsi query backend Anda sudah update menerima parameter 'sort'
// Jika belum, Anda perlu update fungsi listSpjForCurrentUser di backend.
import { listSpjForCurrentUser } from '@/server/spj/queries'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

import SpjSearchBar from '@/components/spj/spj-search-bar'
// Pastikan buat komponen ini (kode ada di bawah)

import { ArrowLeft, ArrowRight, ChevronRight, FileText, Plus } from 'lucide-react'
import SpjDuplicateButton from '@/components/spj/spj-duplicate-button'
import { fmtDateId } from '@/lib/utils'
import SpjExportModal from '@/components/spj/spj-export-modal'
import SpjSortSelect from '@/components/spj/spj-sort-select'

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur'
  })
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

// Update Type SearchParams untuk menerima 'sort'
type SearchParams = Promise<{ q?: string; page?: string; sort?: string }>

export default async function SpjListPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const qRaw = (sp.q ?? '').trim()
  const pageRaw = (sp.page ?? '1').trim()
  // Default sort: departure_desc (Keberangkatan Terbaru)
  const sortRaw = (sp.sort ?? 'departure_desc').trim()

  const pageNum = Number.isFinite(Number(pageRaw)) ? Math.max(1, Math.floor(Number(pageRaw))) : 1
  const pageSize = 10

  // Pass 'sort' ke query database
  const { items: pageItems, total } = await listSpjForCurrentUser({
    q: qRaw,
    skip: (pageNum - 1) * pageSize,
    take: pageSize,
    sort: sortRaw // Pastikan backend menangani ini
  })

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Redirect jika page melebihi total, tapi pertahankan sort & q
  if (pageNum > totalPages && totalPages > 0) {
    redirect(buildQueryString({ q: qRaw, page: String(totalPages), sort: sortRaw }) || '?page=1')
  }

  const rosterView = (roster: { nama: string; role: string }[]) => {
    const firstNames = roster.map((data) => {
      const firstNameRaw = data.nama.trim().split(/\s+/)[0]
      const sanitizedName = firstNameRaw.replace(/[^a-zA-Z0-9]/g, '')
      return sanitizedName
    })
    return firstNames.filter(Boolean).join(', ')
  }

  // Update Pagination Link agar menyertakan 'sort'
  const prevHref = buildQueryString({ q: qRaw, page: String(Math.max(1, pageNum - 1)), sort: sortRaw })
  const nextHref = buildQueryString({ q: qRaw, page: String(Math.min(totalPages, pageNum + 1)), sort: sortRaw })

  const windowSize = 5
  const half = Math.floor(windowSize / 2)
  const pStart = Math.max(1, pageNum - half)
  const pEnd = Math.min(totalPages, pStart + windowSize - 1)
  const pStartFinal = Math.max(1, pEnd - windowSize + 1)
  const pages = Array.from({ length: pEnd - pStartFinal + 1 }).map((_, i) => pStartFinal + i)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            SPJ Perjalanan Dinas
          </h1>
          <p className="text-sm text-muted-foreground/80">Arsip dan pembuatan dokumen SPJ Perjadin.</p>
        </div>
        <div className="flex items-center gap-4">
          <SpjExportModal />
          <Button asChild size="sm" className="h-9 bg-foreground text-background hover:bg-foreground/90">
            <Link href="/spj/new">
              <Plus className="mr-2 h-4 w-4" />
              Buat SPJ
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="bg-border/50" />

      <div className="space-y-4">
        {/* Layout disesuaikan untuk menampung SearchBar dan SortSelect */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl">
            <div className="flex-1">
              <SpjSearchBar initialQ={qRaw} />
            </div>
            <div className="w-full sm:w-60">
              {/* Komponen Sort Baru */}
              <SpjSortSelect currentSort={sortRaw} />
            </div>
          </div>

          <div className="text-[13px] text-muted-foreground tabular-nums bg-muted/30 px-3 py-1 rounded-full border border-border/40 whitespace-nowrap">
            Total: <span className="font-medium text-foreground">{total}</span> entri
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="py-3 font-medium text-foreground">Tujuan</TableHead>
              <TableHead className="table-cell py-3 font-medium text-foreground">Pelaksana</TableHead>
              <TableHead className="py-3 font-medium text-foreground">Periode</TableHead>
              <TableHead className="hidden xl:table-cell py-3 font-medium text-foreground text-center">
                Dibuat
              </TableHead>
              <TableHead className="py-3 font-medium text-foreground">Status Dokumen</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center">
                  <p className="text-sm text-muted-foreground">
                    {qRaw ? `Tidak ada hasil untuk "${qRaw}"` : 'Belum ada data perjalanan dinas.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((spj) => (
                <TableRow key={spj.id} className="group border-border/40 transition-colors hover:bg-muted/10 relative">
                  <TableCell className="p-0 relative">
                    <Link href={`/spj/${spj.id}`} className="absolute inset-0 z-10" />
                    <div className="py-4 px-4">
                      <div className="font-medium text-[14px]">{spj.tempatTujuan}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 xl:hidden italic">
                        Dibuat: {fmtDateId(spj.createdAt)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="table-cell py-4 pointer-events-none">
                    <span className="text-sm text-muted-foreground/90">{rosterView(spj.roster)}</span>
                  </TableCell>

                  <TableCell className="py-4 tabular-nums text-sm pointer-events-none">
                    <div className="flex flex-col">
                      <span>{fmtDateId(spj.tglBerangkat)}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
                        s/d
                      </span>
                      <span>{fmtDateId(spj.tglKembali)}</span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell py-4 text-center pointer-events-none">
                    <div className="text-[11px] font-mono text-muted-foreground/80">{fmtDateTime(spj.createdAt)}</div>
                  </TableCell>

                  <TableCell className="py-4 pointer-events-none">
                    <div className="flex flex-wrap gap-1 max-w-45">
                      <StatusBadge label="TS" active={!!spj.telaahan} />
                      <StatusBadge label="ST" active={!!spj.spjSuratTugas} />
                      <StatusBadge label="SPD" active={true} />
                      <StatusBadge label="DOPD" active={spj.rincian?.length > 0} />
                      <StatusBadge label="KUI" active={!!spj.kuitansi} />
                      <StatusBadge label="VIS" active={!!spj.visum} />
                      <StatusBadge label="LAP" active={!!spj.laporan} />
                    </div>
                  </TableCell>

                  <TableCell className="text-right py-4 relative z-20">
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex items-center">
                        <SpjDuplicateButton id={spj.id} />
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md transition-all hover:bg-background border border-transparent hover:border-border">
                        <Link href={`/spj/${spj.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20">
          <div className="text-xs text-muted-foreground">
            Halaman <span className="text-foreground font-medium">{pageNum}</span> dari{' '}
            <span className="text-foreground font-medium">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="outline" size="icon" className="h-8 w-8" disabled={pageNum <= 1}>
              <Link
                // Sertakan sort pada link pagination
                href={pageNum <= 1 ? '#' : prevHref || '?page=1'}
                className={pageNum <= 1 ? 'pointer-events-none opacity-50' : ''}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <div className="flex items-center gap-1 mx-1">
              {pages.map((p) => (
                <Link
                  key={p}
                  // Sertakan sort pada link page number
                  href={buildQueryString({ q: qRaw, page: String(p), sort: sortRaw }) || `?page=${p}`}
                  className={`text-xs w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                    p === pageNum
                      ? 'bg-foreground text-background font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  {p}
                </Link>
              ))}
            </div>
            <Button asChild variant="outline" size="icon" className="h-8 w-8" disabled={pageNum >= totalPages}>
              <Link
                // Sertakan sort pada link pagination
                href={pageNum >= totalPages ? '#' : nextHref || `?page=${totalPages}`}
                className={pageNum >= totalPages ? 'pointer-events-none opacity-50' : ''}>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
        active
          ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
          : 'bg-muted/30 text-muted-foreground/50 border-border/40 grayscale'
      }`}>
      {label}
    </div>
  )
}
