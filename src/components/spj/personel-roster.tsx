'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Search, UserPlus, Users, Trash2, Crown, Loader2, X } from 'lucide-react'

type RosterItem = {
  id: string
  order: number
  role: 'KEPALA_JALAN' | 'PENGIKUT'
  nama: string
  nip: string | null
  jabatan: string
  golongan: string | null
  pangkat: string | null
}

type PegawaiResult = {
  id: string
  nama: string
  nip: string | null
  jabatan: string
  golongan: string | null
  pangkat: string | null
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])

  return debounced
}

export default function PersonelRoster({ spjId, items }: { spjId: string; items: RosterItem[] }) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 300)

  const [loadingSearch, setLoadingSearch] = useState(false)
  const [results, setResults] = useState<PegawaiResult[]>([])

  const [confirmAddOpen, setConfirmAddOpen] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<PegawaiResult | null>(null)

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RosterItem | null>(null)

  const kepalaId = useMemo(() => items.find((x) => x.role === 'KEPALA_JALAN')?.id, [items])

  useEffect(() => {
    const query = debouncedQ.trim()
    if (query.length < 2) {
      setResults([])
      return
    }

    let cancelled = false

    async function run() {
      setLoadingSearch(true)
      try {
        const res = await fetch(`/api/pegawai/search?q=${encodeURIComponent(query)}`, { method: 'GET' })
        const json = (await res.json()) as { items: PegawaiResult[] }
        if (!cancelled) setResults(json.items)
      } catch {
        if (!cancelled) toast.error('Gagal mencari pegawai.')
      } finally {
        if (!cancelled) setLoadingSearch(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [debouncedQ])

  async function addPegawaiConfirmed(pegawaiId: string) {
    try {
      const res = await fetch(`/api/spj/${spjId}/roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pegawaiId })
      })

      if (!res.ok) {
        toast.error('Gagal menambah pegawai.')
        return
      }

      toast.success('Pegawai ditambahkan.')
      router.refresh()
    } catch {
      toast.error('Gagal menambah pegawai.')
    }
  }

  async function setKepala(rosterItemId: string) {
    try {
      const res = await fetch(`/api/spj/${spjId}/roster`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kepalaRosterItemId: rosterItemId })
      })

      if (!res.ok) {
        toast.error('Gagal set kepala jalan.')
        return
      }

      toast.success('Kepala jalan diperbarui.')
      router.refresh()
    } catch {
      toast.error('Gagal set kepala jalan.')
    }
  }

  async function deleteConfirmed(rosterItemId: string) {
    try {
      const res = await fetch(`/api/spj/${spjId}/roster`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rosterItemId })
      })

      if (!res.ok) {
        toast.error('Gagal menghapus.')
        return
      }

      toast.success('Pegawai dihapus dari roster.')
      router.refresh()
    } catch {
      toast.error('Gagal menghapus.')
    }
  }

  return (
    <div className="space-y-8">
      {/* ====== SEARCH SECTION ====== */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <UserPlus className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold tracking-tight">Tambah Personel</h3>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative group max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  if (!open) setOpen(true)
                }}
                placeholder="Cari berdasarkan Nama, NIP, atau Jabatan..."
                className="pl-9 pr-12 rounded-md border-border/50 bg-background/50 focus-visible:ring-1 shadow-sm h-10"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md border-border/50 shadow-xl"
            align="start"
            sideOffset={8}>
            <Command shouldFilter={false} className="bg-popover">
              <CommandInput
                value={q}
                onValueChange={(v) => setQ(v)}
                placeholder="Ketik nama pegawai..."
                className="h-10 border-none focus:ring-0"
              />
              <CommandList className="max-h-[300px]">
                {loadingSearch ? (
                  <div className="flex items-center justify-center p-6 text-xs text-muted-foreground gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Mencari data...
                  </div>
                ) : (
                  <>
                    <CommandEmpty className="p-6 text-center text-xs text-muted-foreground">
                      {q.trim().length < 2 ? 'Ketik minimal 2 karakter.' : 'Pegawai tidak ditemukan.'}
                    </CommandEmpty>

                    <CommandGroup heading="Hasil Pencarian" className="px-2 pb-2">
                      {results.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.id}
                          onSelect={() => {
                            setSelectedPegawai(p)
                            setConfirmAddOpen(true)
                            setOpen(false)
                          }}
                          className="rounded-md cursor-pointer py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-medium leading-none">{p.nama}</span>
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {p.nip ?? 'Tanpa NIP'} • {p.jabatan}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* ====== TABLE ROSTER ====== */}
      <Card className="rounded-lg border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Daftar Roster Personel</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono border-border/60 font-medium">
            {items.length} Personel
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="w-[60px] text-center text-[11px] font-bold uppercase tracking-wider">
                    #
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider">Informasi Pegawai</TableHead>
                  <TableHead className="hidden md:table-cell text-[11px] font-bold uppercase tracking-wider">
                    Jabatan
                  </TableHead>
                  <TableHead className="w-[100px] text-[11px] font-bold uppercase tracking-wider">Peran</TableHead>
                  <TableHead className="w-[180px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <Users className="h-8 w-8" />
                        <p className="text-xs">Belum ada personel yang ditambahkan.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it) => (
                    <TableRow key={it.id} className="group border-border/40 hover:bg-muted/20 transition-colors">
                      <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                        {it.order}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-foreground leading-tight">{it.nama}</span>
                          <span className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{it.nip ?? '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3">
                        <span className="text-[12px] text-muted-foreground leading-snug">{it.jabatan}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        {it.role === 'KEPALA_JALAN' ? (
                          <Badge className="bg-foreground text-background hover:bg-foreground h-5 text-[9px] uppercase tracking-tighter rounded-sm border-none">
                            <Crown className="w-2.5 h-2.5 mr-1" /> Kepala
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-muted/50 text-muted-foreground h-5 text-[9px] uppercase tracking-tighter rounded-sm border-none">
                            Pengikut
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right py-3 pr-6">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[11px] px-3 font-medium hover:bg-background border border-transparent hover:border-border/50"
                            disabled={kepalaId === it.id}
                            onClick={() => setKepala(it.id)}>
                            Set Kepala
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
                            onClick={() => {
                              setDeleteTarget(it)
                              setConfirmDeleteOpen(true)
                            }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ====== ALERTS ====== */}
      <AlertDialog open={confirmAddOpen} onOpenChange={setConfirmAddOpen}>
        <AlertDialogContent className="rounded-md border-border/50 max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Konfirmasi Tambah</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Tambahkan <span className="text-foreground font-medium">{selectedPegawai?.nama}</span> ke dalam daftar
              personel perjalanan dinas ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-9 rounded-md text-xs" onClick={() => setSelectedPegawai(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-9 rounded-md text-xs bg-foreground text-background hover:bg-foreground/90"
              onClick={async () => {
                if (!selectedPegawai) return
                const id = selectedPegawai.id
                setSelectedPegawai(null)
                await addPegawaiConfirmed(id)
              }}>
              Ya, Tambahkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="rounded-md border-border/50 max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold text-destructive">Hapus Personel</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Keluarkan <span className="text-foreground font-medium">{deleteTarget?.nama}</span> dari roster SPJ?
              Urutan personel akan disesuaikan kembali secara otomatis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-9 rounded-md text-xs" onClick={() => setDeleteTarget(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-9 rounded-md text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
              onClick={async () => {
                if (!deleteTarget) return
                const id = deleteTarget.id
                setDeleteTarget(null)
                await deleteConfirmed(id)
              }}>
              Hapus Personel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
