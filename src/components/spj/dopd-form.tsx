'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Loader2,
  Plus,
  Printer,
  Save,
  Search,
  Trash2,
  UserCircle,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KategoriBiayaSelect } from './biaya-selector'
import { UraianPresetPicker } from './uraian-preset'
import { HargaPresetPicker } from './harga-preset'

type RosterItem = {
  id: string
  order: number
  role: 'KEPALA_JALAN' | 'PENGIKUT'
  nama: string
  nip: string | null
  jabatan: string
  pangkat: string | null
  golongan: string | null
}

type Factor = {
  id: string
  order: number
  label: string
  qty: number
}

type BiayaItem = {
  id: string
  rosterItemId: string
  kategori: string
  uraian: string
  hargaSatuan: number
  total: number
  factors: Factor[]
}

type PegawaiResult = {
  id: string
  nama: string
  nip: string | null
  jabatan: string
  golongan: string | null
  pangkat: string | null
}

// --- Utils ---
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

function rupiah(n: number) {
  return new Intl.NumberFormat('id-ID').format(Math.round(n))
}

function computeTotal(hargaSatuan: number, factors: Array<{ qty: number }>) {
  const mult = factors.reduce((acc, f) => acc * (Number.isFinite(f.qty) && f.qty > 0 ? f.qty : 1), 1)
  return hargaSatuan * (mult > 0 ? mult : 1)
}

// --- Components ---

function SignerCombobox({
  label,
  value,
  onChange
}: {
  label: string
  value: PegawaiResult | null
  onChange: (v: PegawaiResult | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState(value?.nama ?? '')
  const debouncedQ = useDebouncedValue(q, 300)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [results, setResults] = useState<PegawaiResult[]>([])

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
        const res = await fetch(`/api/pegawai/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserCircle className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'group flex flex-col items-start p-4 w-full rounded-xl border border-border/50 bg-background hover:border-border transition-all cursor-pointer shadow-none',
              value && 'border-primary/20 bg-primary/2'
            )}>
            {value ? (
              <div className="w-full text-left">
                <div className="text-sm font-semibold">{value.nama}</div>
                <div className="text-[11px] text-muted-foreground mt-1 truncate">
                  {value.nip ?? '-'} • {value.jabatan || 'Pejabat'}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="w-4 h-4" />
                <span>Klik untuk mencari penandatangan...</span>
              </div>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-85 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput value={q} onValueChange={setQ} placeholder="Nama/NIP Pejabat..." className="h-10" />
            <CommandList>
              {loadingSearch ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty className="p-4 text-xs text-center text-muted-foreground">
                    Minimal 2 karakter.
                  </CommandEmpty>
                  <CommandGroup>
                    {results.map((p) => (
                      <CommandItem
                        key={p.id}
                        onSelect={() => {
                          onChange(p)
                          setQ(p.nama)
                          setOpen(false)
                        }}
                        className="p-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{p.nama}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {p.nip} • {p.jabatan}
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
  )
}

type DraftFactor = { id: string; order: number; label: string; qty: number }
type DraftItem = {
  id: string
  rosterItemId: string
  kategori: string
  uraian: string
  hargaSatuan: number
  factors: DraftFactor[]
}

function ItemEditorSheet({
  open,
  onOpenChange,
  rosterLabel,
  item,
  onSave,
  onDelete,
  asal,
  tujuan
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  rosterLabel: string
  item: DraftItem | null
  onSave: (next: DraftItem) => void
  onDelete?: (id: string) => void
  asal: string
  tujuan: string
}) {
  const [draft, setDraft] = useState<DraftItem | null>(item)
  useEffect(() => {
    setDraft(item)
  }, [item])

  const total = useMemo(() => (draft ? computeTotal(draft.hargaSatuan, draft.factors) : 0), [draft])

  if (!draft) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-8 pt-8 pb-6 border-b border-border/40">
          <SheetTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground">
            Editor Rincian Biaya
          </SheetTitle>
          <SheetDescription className="text-foreground font-semibold text-base mt-2">{rosterLabel}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
          {/* Section: Main Detail */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Informasi Utama</h3>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <KategoriBiayaSelect value={draft.kategori} onChange={(val) => setDraft({ ...draft, kategori: val })} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Harga Satuan (Rp)</label>

                  {/* Pasang Picker di sini */}
                  <HargaPresetPicker onPick={(nominal) => setDraft({ ...draft, hargaSatuan: nominal })} />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">Rp</span>
                  <Input
                    type="number"
                    value={draft.hargaSatuan}
                    onChange={(e) => setDraft({ ...draft, hargaSatuan: Math.floor(Number(e.target.value)) })}
                    className="pl-9 rounded-lg bg-muted/20 border-border/40 text-sm h-10 font-mono text-right shadow-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Uraian Detail</label>
                {/* Penambahan Preset Picker */}
                <UraianPresetPicker onPick={(val) => setDraft({ ...draft, uraian: val })} asal={asal} tujuan={tujuan} />
              </div>
              <Textarea
                value={draft.uraian}
                onChange={(e) => setDraft({ ...draft, uraian: e.target.value })}
                placeholder="Contoh: Transportasi darat dari Sendawar ke Balikpapan (PP)..."
                className="rounded-lg bg-muted/20 border-border/40 text-sm min-h-25 resize-none shadow-none"
              />
            </div>
          </div>

          {/* Section: Factors */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Faktor Pengali</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] font-bold rounded-md px-2 border-primary/20 bg-primary/5 text-primary shadow-none"
                onClick={() =>
                  setDraft({
                    ...draft,
                    factors: [
                      ...draft.factors,
                      { id: crypto.randomUUID(), order: draft.factors.length + 1, label: 'kali', qty: 1 }
                    ]
                  })
                }>
                <Plus className="w-3 h-3 mr-1" /> Tambah Faktor
              </Button>
            </div>

            <div className="space-y-3">
              {draft.factors.map((f, idx) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/5 group">
                  <span className="text-[10px] font-mono text-muted-foreground bg-background border rounded h-6 w-6 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <Input
                    placeholder="Unit (Hari/Org)"
                    value={f.label}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        factors: draft.factors.map((x) => (x.id === f.id ? { ...x, label: e.target.value } : x))
                      })
                    }
                    className="flex-1 h-9 bg-transparent border-transparent shadow-none focus-visible:ring-0 text-sm font-medium"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={f.qty}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          factors: draft.factors.map((x) => (x.id === f.id ? { ...x, qty: Number(e.target.value) } : x))
                        })
                      }
                      className="w-16 h-9 rounded-md bg-background text-right font-mono text-xs shadow-none"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => setDraft({ ...draft, factors: draft.factors.filter((x) => x.id !== f.id) })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Calculation Preview */}
        <div className="p-8 py-4 border-t border-border/40 bg-muted/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
              Simulasi Total Item
            </span>
            <div className="text-right">
              <div className="text-xl font-mono font-bold tracking-tighter">Rp {rupiah(total)}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 w-full border-t border-border/50">
            {/* Tombol Hapus: Menggunakan order-last di mobile agar tidak mengganggu fokus utama */}
            {onDelete ? (
              <Button
                variant="ghost"
                className="order-last sm:order-first w-full sm:w-auto text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-10 sm:h-9 shadow-none"
                onClick={() => {
                  onDelete(draft.id)
                  onOpenChange(false)
                }}>
                <Trash2 className="w-3.5 h-3.5 mr-2 sm:hidden" />{' '}
                {/* Ikon hanya muncul di mobile untuk memperjelas aksi */}
                Hapus Item Ini
              </Button>
            ) : (
              <div className="hidden sm:block" />
            )}

            {/* Group Tombol Batal & Simpan */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                className="order-2 sm:order-1 w-full sm:w-24 rounded-xl h-10 sm:h-9 text-[11px] font-bold uppercase tracking-wider shadow-none"
                onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button
                className="order-1 sm:order-2 w-full sm:w-32 rounded-xl h-10 sm:h-9 text-[11px] font-bold uppercase tracking-wider shadow-none"
                onClick={() => {
                  onSave(draft)
                  onOpenChange(false)
                }}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// --- Main Form ---

export default function DopdForm({
  spjId,
  spj,
  roster,
  initialItems,
  initialSigners
}: {
  spjId: string
  roster: RosterItem[]
  spj: { asal: string; tujuan: string }
  initialItems: BiayaItem[]
  initialSigners: { order: number; pegawaiId: string | null; nama: string; nip: string | null }[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Sort roster so Kepala is always first
  const rosterSorted = useMemo(() => [...roster].sort((a) => (a.role === 'KEPALA_JALAN' ? -1 : 1)), [roster])

  const [items, setItems] = useState<DraftItem[]>(() =>
    initialItems.map((it) => ({
      id: it.id,
      rosterItemId: it.rosterItemId,
      kategori: it.kategori,
      uraian: it.uraian,
      hargaSatuan: it.hargaSatuan,
      factors: (it.factors ?? []).map((f) => ({ id: f.id, order: f.order, label: f.label, qty: f.qty }))
    }))
  )

  const [kpa, setKpa] = useState<PegawaiResult | null>(null)
  const [bpp, setBpp] = useState<PegawaiResult | null>(null)

  useEffect(() => {
    const s1 = initialSigners.find((s) => s.order === 1)
    const s2 = initialSigners.find((s) => s.order === 2)
    if (s1?.pegawaiId)
      setKpa({ id: s1.pegawaiId, nama: s1.nama, nip: s1.nip, jabatan: '', golongan: null, pangkat: null })
    if (s2?.pegawaiId)
      setBpp({ id: s2.pegawaiId, nama: s2.nama, nip: s2.nip, jabatan: '', golongan: null, pangkat: null })
  }, [initialSigners])

  const [activeRosterId, setActiveRosterId] = useState<string>(rosterSorted[0]?.id ?? '')
  const activeRoster = rosterSorted.find((r) => r.id === activeRosterId)

  const totalsByRoster = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rosterSorted) {
      const subtotal = items
        .filter((x) => x.rosterItemId === r.id)
        .reduce((acc, it) => acc + computeTotal(it.hargaSatuan, it.factors), 0)
      map.set(r.id, subtotal)
    }
    return map
  }, [items, rosterSorted])

  const grandTotal = useMemo(() => Array.from(totalsByRoster.values()).reduce((a, b) => a + b, 0), [totalsByRoster])

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const editingItem = items.find((x) => x.id === editingItemId) ?? null

  async function onSaveAll() {
    setSaving(true)
    try {
      const payload = {
        items: items.map((it) => ({
          ...it,
          kategori: it.kategori.trim(),
          uraian: it.uraian.trim(),
          hargaSatuan: Math.floor(Number(it.hargaSatuan) || 0),
          factors: it.factors.map((f) => ({ ...f, label: f.label.trim(), qty: Math.max(1, Number(f.qty) || 1) }))
        })),
        signers: [
          { order: 1, pegawaiId: kpa?.id ?? null },
          { order: 2, pegawaiId: bpp?.id ?? null }
        ]
      }
      const res = await fetch(`/api/spj/${spjId}/dopd`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error()
      toast.success('DOPD tersimpan.')
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  // Navigation Logic
  const currentIndex = rosterSorted.findIndex((r) => r.id === activeRosterId)
  const goPrev = () => currentIndex > 0 && setActiveRosterId(rosterSorted[currentIndex - 1].id)
  const goNext = () => currentIndex < rosterSorted.length - 1 && setActiveRosterId(rosterSorted[currentIndex + 1].id)

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* 1. STICKY TOP BAR: Summary & Main Actions */}
      <div className="sticky top-0 z-30 -mx-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/40 sm:mx-0 px-6 sm:rounded-xl sm:border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight uppercase text-muted-foreground/80">
                Total Pengajuan DOPD
              </h1>
              <div className="text-xl font-mono font-bold tracking-tighter">Rp {rupiah(grandTotal)}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9 font-semibold text-sm shadow-none border-border/60"
              onClick={() => window.open(`/spj/${spjId}/dopd/print`, '_blank')}>
              <Printer className="w-3.5 h-3.5 mr-2" /> Preview PDF
            </Button>
            <Button
              size="sm"
              className="rounded-lg h-9 px-6 font-semibold text-sm shadow-none"
              onClick={onSaveAll}
              disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
              Simpan DOPD
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 w-full items-start">
        {/* 2. SIDEBAR: Penandatangan */}
        {/* Perbaikan: Gunakan min-w-0 agar grid child tidak melebihi alokasi kolomnya */}
        <div className="lg:col-span-4 space-y-6 w-full min-w-0">
          {/* Perbaikan: Hapus w-max, gunakan w-full agar Card patuh pada lebar grid sidebar */}
          <Card className="rounded-xl border-border/40 shadow-none bg-card/50 w-full overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Otorisasi Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SignerCombobox sudah dioptimasi di internalnya untuk wrapping teks */}
              <SignerCombobox label="Kuasa Pengguna Anggaran (KPA)" value={kpa} onChange={setKpa} />
              <Separator className="bg-border/40" />
              <SignerCombobox label="Bendahara Pengeluaran Pembantu" value={bpp} onChange={setBpp} />
            </CardContent>
          </Card>
        </div>

        {/* 3. MAIN AREA: Rincian Biaya per Roster */}
        {/* Perbaikan: min-w-0 di sini krusial agar area rincian tidak mendorong sidebar keluar layar saat tabel discroll */}
        <div className="lg:col-span-8 space-y-6 w-full min-w-0">
          <Card className="rounded-xl border-border/40 shadow-none overflow-hidden">
            {/* Personnel Header: Responsive Padding & Navigation */}
            <div className="bg-muted/10 px-4 sm:px-6 py-4 border-b border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex justify-center items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background border border-border/40 shrink-0"
                  onClick={goPrev}
                  disabled={currentIndex === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-center sm:text-left min-w-35 px-4 py-2">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none mb-1">
                    Personel Ke-{currentIndex + 1}
                  </div>
                  <div className="text-sm font-bold truncate max-w-50">{activeRoster?.nama}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background border border-border/40 shrink-0"
                  onClick={goNext}
                  disabled={currentIndex === rosterSorted.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none mb-1">
                    Subtotal
                  </div>
                  <div className="text-sm font-mono font-bold text-primary">
                    Rp {rupiah(totalsByRoster.get(activeRosterId) ?? 0)}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="rounded-lg h-8 px-4 text-[10px] font-bold uppercase tracking-tighter shadow-sm cursor-pointer"
                  onClick={() => {
                    const newItem = {
                      id: crypto.randomUUID(),
                      rosterItemId: activeRosterId,
                      kategori: '',
                      uraian: '',
                      hargaSatuan: 0,
                      factors: [
                        { id: crypto.randomUUID(), order: 1, label: 'org', qty: 1 },
                        { id: crypto.randomUUID(), order: 2, label: 'hari', qty: 1 }
                      ]
                    }
                    setItems([...items, newItem])
                    setEditingItemId(newItem.id)
                    setEditorOpen(true)
                  }}>
                  <Plus className="w-3 h-3 mr-1" /> ITEM BIAYA
                </Button>
              </div>
            </div>

            <CardContent className="p-0">
              {/* PERBAIKAN UTAMA: Scroll X Auto dengan pembatasan lebar tabel */}
              <div className="w-full overflow-x-auto overflow-y-hidden bg-white scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                {/* min-w-[700px] menjaga desain linear tetap sejajar saat discroll di mobile */}
                <Table className="min-w-187.5 w-full">
                  <TableHeader className="bg-muted/5">
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="w-35 text-[10px] font-bold uppercase pl-6">Kategori</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Rincian Uraian</TableHead>
                      <TableHead className="w-32.5 text-right text-[10px] font-bold uppercase">Harga Satuan</TableHead>
                      <TableHead className="w-37.5 text-right text-[10px] font-bold uppercase pr-4">
                        Total Akhir
                      </TableHead>
                      <TableHead className="w-12.5"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.filter((it) => it.rosterItemId === activeRosterId).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-40">
                            <CreditCard className="w-8 h-8" />
                            <p className="text-xs">Belum ada rincian biaya.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items
                        .filter((it) => it.rosterItemId === activeRosterId)
                        .map((it) => {
                          const subTotal = computeTotal(it.hargaSatuan, it.factors)
                          return (
                            <TableRow
                              key={it.id}
                              className="border-border/40 hover:bg-slate-50 transition-colors group cursor-pointer"
                              onClick={() => {
                                setEditingItemId(it.id)
                                setEditorOpen(true)
                              }}>
                              <TableCell className="align-top py-4 pl-6">
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-bold uppercase tracking-tighter bg-white whitespace-nowrap">
                                  {it.kategori || 'BIAYA'}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top py-4 min-w-70">
                                <div className="text-sm font-medium leading-relaxed text-zinc-800">
                                  {it.uraian || 'Tanpa uraian...'}
                                </div>
                                <div className="flex items-center gap-1.5 mt-2.5">
                                  {it.factors.map((f) => (
                                    <div
                                      key={f.id}
                                      className="text-[9px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/20 whitespace-nowrap">
                                      {f.qty} {f.label}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right align-top py-4 font-mono text-sm text-zinc-500 whitespace-nowrap">
                                {rupiah(it.hargaSatuan)}
                              </TableCell>
                              <TableCell className="text-right align-top py-4 font-mono text-sm font-bold text-zinc-900 pr-4 whitespace-nowrap">
                                {rupiah(subTotal)}
                              </TableCell>
                              <TableCell className="text-right py-4 pr-6 align-top">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-300 hover:text-destructive group-hover:text-destructive transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setItems(items.filter((x) => x.id !== it.id))
                                  }}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. MODALS & SHEETS */}
      <ItemEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        rosterLabel={activeRoster?.nama ?? 'Pegawai'}
        item={editingItem}
        onSave={(next) => setItems(items.map((x) => (x.id === next.id ? next : x)))}
        onDelete={(id) => setItems(items.filter((x) => x.id !== id))}
        asal={spj.asal}
        tujuan={spj.tujuan}
      />
    </div>
  )
}
