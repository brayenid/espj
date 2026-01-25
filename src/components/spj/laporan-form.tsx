/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { LaporanHasilMode } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

// Import Dialog & ScrollArea untuk Preset Picker
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

// Import JSON Preset Laporan
import PRESETS_LAPORAN from '@/data/laporan-preset.json'

import {
  Crown,
  FileSignature,
  FileText,
  Loader2,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Trash2,
  UserCheck,
  Users,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

type RosterItem = {
  id: string
  order: number
  role: 'KEPALA_JALAN' | 'PENGIKUT'
  nama: string
  nip: string | null
  jabatan: string
  pangkat: string | null
  golongan: string | null
  instansi: string | null
}

type SpjLite = {
  noSuratTugas: string | null
  tglSuratTugas: Date
  kotaTandaTangan: string
  maksudDinas: string
  tempatBerangkat: string
  tempatTujuan: string
}

type PegawaiResult = {
  id: string
  nama: string
  nip: string | null
  jabatan: string
  golongan: string | null
  pangkat: string | null
}

type InitialLaporan = {
  dasarLaporan: string | null
  kegiatan: string | null
  waktu: string | null
  lokasi: string | null
  tujuan: string | null

  signerPegawaiId: string | null
  signerNama: string | null
  signerNip: string | null
  signerJabatan: string | null
  signerPangkat: string | null
  signerGolongan: string | null
  signerJabatanTampil: string | null

  hasilMode: LaporanHasilMode
  hasilPembuka: string | null
  hasilPoin: string[]
  hasilNarasi: string | null
} | null

type PresetKey = keyof typeof PRESETS_LAPORAN
type PresetItem = (typeof PRESETS_LAPORAN)[PresetKey][number]

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

function sortRoster(list: RosterItem[]) {
  return [...list].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'KEPALA_JALAN' ? -1 : 1
    return a.order - b.order
  })
}

function fmtDateId(d: Date) {
  try {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

function normalizePreview(s: any, max = 120) {
  const text = Array.isArray(s) ? s.join(' ') : String(s)
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function PresetPicker({
  open,
  onOpenChange,
  title,
  items,
  onPick
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  items: PresetItem[]
  onPick: (text: any) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border-border/50 p-0 shadow-2xl text-left">
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <DialogTitle className="text-sm font-bold uppercase tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-2 p-4">
            {items.map((p) => (
              <button
                key={p.id}
                type="button"
                className="group w-full rounded-lg border border-border/40 bg-background p-4 text-left transition-all hover:bg-muted/50 active:scale-[0.98]"
                onClick={() => onPick(p.text)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">
                      {p.title}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {normalizePreview(p.text)}
                    </div>
                  </div>
                  <Badge variant="outline" className="h-6 text-[9px] uppercase">
                    Pilih
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

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
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PegawaiResult[]>([])

  useEffect(() => {
    const query = debouncedQ.trim()
    if (query.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch(`/api/pegawai/search?q=${encodeURIComponent(query)}`)
        const json = (await res.json()) as { items: PegawaiResult[] }
        if (!cancelled) setResults(json.items ?? [])
      } catch {
        if (!cancelled) toast.error('Gagal mencari pegawai.')
      } finally {
        if (!cancelled) setLoading(false)
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
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'group flex flex-col items-start p-3 w-full rounded-xl border border-border/50 bg-background hover:border-border transition-all cursor-pointer shadow-none',
              value && 'border-primary/20 bg-primary/2'
            )}>
            {value ? (
              <div className="w-full text-left">
                <div className="text-sm font-semibold">{value.nama}</div>
                <div className="text-[10px] text-muted-foreground mt-1 truncate">
                  {value.nip ?? '-'} • {value.jabatan || 'Pejabat'}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="w-4 h-4" />
                <span>Cari penandatangan...</span>
              </div>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-85 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput value={q} onValueChange={setQ} placeholder="Cari pegawai..." className="h-10" />
            <CommandList>
              {loading ? (
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
                        className="p-3 cursor-pointer">
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

function SyncButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-[9px] font-bold text-primary hover:bg-primary/10 transition-colors active:scale-95 uppercase tracking-tighter">
      <RotateCcw className="w-2.5 h-2.5" />
      Sinkron
    </button>
  )
}

export default function LaporanForm({
  spjId,
  spj,
  roster,
  initial
}: {
  spjId: string
  spj: SpjLite
  roster: RosterItem[]
  initial: InitialLaporan
}) {
  const router = useRouter()
  const rosterSorted = useMemo(() => sortRoster(roster), [roster])

  const [dasarLaporan, setDasarLaporan] = useState(
    initial?.dasarLaporan ?? `Surat Tugas Nomor ${spj.noSuratTugas ?? '-'}`
  )
  const [kegiatan, setKegiatan] = useState(initial?.kegiatan ?? spj.maksudDinas ?? '')
  const [waktu, setWaktu] = useState(initial?.waktu ?? fmtDateId(new Date()))
  const [lokasi, setLokasi] = useState(initial?.lokasi ?? spj.tempatTujuan ?? '')
  const [tujuan, setTujuan] = useState(initial?.tujuan ?? spj.tempatTujuan ?? '')

  const [signer, setSigner] = useState<PegawaiResult | null>(null)
  const [signerJabatanTampil, setSignerJabatanTampil] = useState(initial?.signerJabatanTampil ?? '')

  const [hasilMode, setHasilMode] = useState<LaporanHasilMode>(initial?.hasilMode ?? 'POINTS')
  const [hasilPembuka, setHasilPembuka] = useState(initial?.hasilPembuka ?? '')
  const [hasilNarasi, setHasilNarasi] = useState(initial?.hasilNarasi ?? '')
  const [hasilPoin, setHasilPoin] = useState<string[]>(() => (initial?.hasilPoin?.length ? initial.hasilPoin : ['']))

  const [presetOpen, setPresetOpen] = useState<null | PresetKey>(null)
  const [activePoinIndex, setActivePoinIndex] = useState<number | null>(null) // Melacak butir mana yang diisi

  useEffect(() => {
    if (!initial?.signerPegawaiId) return
    setSigner({
      id: initial.signerPegawaiId,
      nama: initial.signerNama ?? '',
      nip: initial.signerNip ?? null,
      jabatan: initial.signerJabatan ?? '',
      pangkat: initial.signerPangkat ?? null,
      golongan: initial.signerGolongan ?? null
    })
  }, [initial])

  const [saving, setSaving] = useState(false)

  const addPoin = () => setHasilPoin((prev) => [...prev, ''])
  const updatePoin = (i: number, v: string) => setHasilPoin((prev) => prev.map((x, idx) => (idx === i ? v : x)))
  const removePoin = (i: number) => setHasilPoin((prev) => prev.filter((_, idx) => idx !== i))

  async function onSave() {
    setSaving(true)
    try {
      const payload = {
        dasarLaporan: dasarLaporan.trim() || null,
        kegiatan: kegiatan.trim() || null,
        waktu: waktu.trim() || null,
        lokasi: lokasi.trim() || null,
        tujuan: tujuan.trim() || null,
        signerPegawaiId: signer?.id ?? null,
        signerJabatanTampil: signerJabatanTampil.trim() || null,
        hasilMode,
        hasilPembuka: hasilPembuka.trim() || null,
        hasilNarasi: hasilNarasi.trim() || null,
        hasilPoin: hasilMode === 'POINTS' ? hasilPoin.map((x) => x.trim()).filter((x) => x.length > 0) : []
      }
      const res = await fetch(`/api/spj/${spjId}/laporan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error()
      toast.success('Laporan tersimpan.')
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan laporan.')
    } finally {
      setSaving(false)
    }
  }

  const handlePickPreset = (val: string) => {
    if (presetOpen === 'hasilPembuka') {
      setHasilPembuka(val)
    } else if (presetOpen === 'hasilNarasi') {
      setHasilNarasi(val)
    } else if (presetOpen === 'hasilPoin') {
      if (activePoinIndex !== null) {
        // Update butir yang sedang aktif
        updatePoin(activePoinIndex, val)
      } else {
        // Tambah butir baru di paling bawah
        setHasilPoin((prev) => {
          const last = prev[prev.length - 1]
          if (last === '') {
            return [...prev.slice(0, -1), val]
          }
          return [...prev, val]
        })
      }
    }
    setPresetOpen(null)
    setActivePoinIndex(null)
  }

  // Handler Sinkronisasi
  const syncField = (field: 'dasar' | 'kegiatan' | 'lokasi' | 'tujuan') => {
    switch (field) {
      case 'dasar':
        setDasarLaporan(`Surat Tugas Nomor ${spj.noSuratTugas ?? '-'}`)
        break
      case 'kegiatan':
        setKegiatan(spj.maksudDinas ?? '')
        break
      case 'lokasi':
        setLokasi(spj.tempatTujuan ?? '')
        break
      case 'tujuan':
        setTujuan(spj.tempatTujuan ?? '')
        break
    }
    toast.info(`Data ${field} disinkronkan dari SPJ master.`, { duration: 1500 })
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 text-left">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border border-border/40 p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background rounded-md border border-border/50 shadow-xs">
            <FileSignature className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold tracking-tight uppercase">Laporan</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
              Pembuatan laporan pasca perjalanan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-9 font-semibold text-xs border-border/60 shadow-none"
            onClick={() => window.open(`/spj/${spjId}/laporan/print`, '_blank')}
            disabled={rosterSorted.length === 0}>
            <Printer className="w-3.5 h-3.5 mr-2" /> Preview PDF
          </Button>
          <Button
            size="sm"
            className="rounded-lg h-9 px-6 font-semibold text-xs shadow-none"
            onClick={onSave}
            disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
            Simpan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-xl border-border/40 shadow-none bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" /> Penandatangan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SignerCombobox label="Pilih Pejabat" value={signer} onChange={setSigner} />
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Jabatan Tampil (Opsional)
                </label>
                <Input
                  value={signerJabatanTampil}
                  onChange={(e) => setSignerJabatanTampil(e.target.value)}
                  placeholder="Contoh: KEPALA BAGIAN..."
                  className="h-10 rounded-lg text-sm shadow-none text-left"
                />
              </div>
            </CardContent>
          </Card>

          {/* Personel List */}
          <Card className="rounded-xl border-border/40 shadow-none bg-muted/5 p-5">
            <div className="text-[10px] font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Personel
            </div>
            {rosterSorted.length === 0 ? (
              <div className="text-[11px] text-muted-foreground italic p-4 text-center border border-dashed rounded-lg">
                Roster kosong.
              </div>
            ) : (
              <div className="space-y-2">
                {rosterSorted.map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background text-[11px] font-semibold">
                    <span className="truncate pr-2">
                      {i + 1}. {r.nama}
                    </span>
                    {r.role === 'KEPALA_JALAN' && <Crown className="w-3 h-3 text-primary shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="rounded-xl border-border/40 shadow-none">
            <CardHeader className="bg-muted/10 border-b border-border/40 px-6 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Rincian Laporan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Dasar Laporan</label>
                    <SyncButton onClick={() => syncField('dasar')} />
                  </div>
                  <Input
                    value={dasarLaporan}
                    onChange={(e) => setDasarLaporan(e.target.value)}
                    className="h-10 rounded-lg text-sm shadow-none text-left"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Waktu</label>
                  <Input
                    value={waktu}
                    onChange={(e) => setWaktu(e.target.value)}
                    className="h-10 rounded-lg text-sm shadow-none text-left"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Lokasi</label>
                    <SyncButton onClick={() => syncField('lokasi')} />
                  </div>
                  <Input
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    className="h-10 rounded-lg text-sm shadow-none text-left"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Tujuan</label>
                    <SyncButton onClick={() => syncField('tujuan')} />
                  </div>
                  <Input
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                    className="h-10 rounded-lg text-sm shadow-none text-left"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Kegiatan</label>
                  <SyncButton onClick={() => syncField('kegiatan')} />
                </div>
                <Textarea
                  value={kegiatan}
                  onChange={(e) => setKegiatan(e.target.value)}
                  rows={3}
                  className="rounded-lg text-sm resize-none shadow-none text-left"
                />
              </div>

              <Separator />

              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Hasil Laporan</label>
                  <RadioGroup
                    value={hasilMode}
                    onValueChange={(v: any) => setHasilMode(v)}
                    className="flex bg-muted p-1 rounded-lg border">
                    <div
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md',
                        hasilMode === 'POINTS' && 'bg-background shadow-sm'
                      )}>
                      <RadioGroupItem value="POINTS" id="m-pts" className="sr-only" />
                      <Label htmlFor="m-pts" className="text-[10px] font-bold cursor-pointer">
                        POIN
                      </Label>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md',
                        hasilMode === 'NARRATIVE' && 'bg-background shadow-sm'
                      )}>
                      <RadioGroupItem value="NARRATIVE" id="m-nar" className="sr-only" />
                      <Label htmlFor="m-nar" className="text-[10px] font-bold cursor-pointer">
                        NARASI
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Pembuka</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-bold text-primary border-primary/20 bg-primary/5 shadow-none"
                        onClick={() => setPresetOpen('hasilPembuka')}>
                        <Zap className="w-3 h-3 mr-1.5" /> Preset
                      </Button>
                    </div>
                    <Textarea
                      value={hasilPembuka}
                      onChange={(e) => setHasilPembuka(e.target.value)}
                      rows={2}
                      className="rounded-lg text-sm border-dashed shadow-none text-left"
                      placeholder="Setelah melakukan kegiatan..."
                    />
                  </div>

                  {hasilMode === 'POINTS' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-[10px] font-bold uppercase">Butir Hasil</span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] font-bold text-primary border-primary/20 bg-primary/5 shadow-none"
                            onClick={() => {
                              setActivePoinIndex(null)
                              setPresetOpen('hasilPoin')
                            }}>
                            <Zap className="w-3 h-3 mr-1.5" /> Preset Poin
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[9px] font-bold rounded-md px-2 shadow-none"
                            onClick={addPoin}>
                            <Plus className="w-3 h-3 mr-1" /> TAMBAH
                          </Button>
                        </div>
                      </div>
                      {hasilPoin.map((p, idx) => (
                        <div key={idx} className="flex gap-2 group items-start">
                          <div className="h-10 w-10 flex flex-col gap-1 items-center justify-center shrink-0">
                            <div className="text-[10px] font-mono text-muted-foreground">#{idx + 1}</div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => {
                                setActivePoinIndex(idx)
                                setPresetOpen('hasilPoin')
                              }}>
                              <Zap className="w-3 h-3" />
                            </Button>
                          </div>
                          <Textarea
                            value={p}
                            onChange={(e) => updatePoin(idx, e.target.value)}
                            placeholder={`Poin ${idx + 1}`}
                            rows={2}
                            className="min-h-10 text-sm rounded-lg resize-none shadow-none text-left flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 shadow-none text-muted-foreground hover:text-destructive"
                            onClick={() => removePoin(idx)}
                            disabled={hasilPoin.length <= 1}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Narasi</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] font-bold text-primary border-primary/20 bg-primary/5 shadow-none"
                          onClick={() => setPresetOpen('hasilNarasi')}>
                          <Zap className="w-3 h-3 mr-1.5" /> Preset Narasi
                        </Button>
                      </div>
                      <Textarea
                        value={hasilNarasi}
                        onChange={(e) => setHasilNarasi(e.target.value)}
                        rows={12}
                        className="rounded-lg text-sm p-4 leading-relaxed text-left shadow-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {(['hasilPembuka', 'hasilPoin', 'hasilNarasi'] as const).map((key) => (
        <PresetPicker
          key={key}
          open={presetOpen === key}
          onOpenChange={(v) => {
            setPresetOpen(v ? key : null)
            if (!v) setActivePoinIndex(null)
          }}
          title={`Pilih Preset ${
            key === 'hasilPembuka' ? 'Pembuka' : key === 'hasilPoin' ? 'Hasil (Butir)' : 'Hasil (Narasi)'
          }`}
          items={(PRESETS_LAPORAN[key as PresetKey] || []) as any}
          onPick={handlePickPreset}
        />
      ))}
    </div>
  )
}
