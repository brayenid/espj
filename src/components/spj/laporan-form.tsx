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
import {
  ClipboardCheck,
  FileText,
  LayoutList,
  Loader2,
  Plus,
  Printer,
  Save,
  Search,
  Trash2,
  UserCheck,
  Users
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
        <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'group flex flex-col items-start p-4 w-full rounded-xl border border-border/50 bg-background hover:border-border transition-all cursor-pointer shadow-sm',
              value && 'border-primary/20 bg-primary/[0.02]'
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

        <PopoverContent className="w-[340px] p-0" align="start">
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

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* 1. Header Bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border border-border/40 p-6 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <ClipboardCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase text-muted-foreground/80">
              Laporan Hasil Perjalanan
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-9 font-bold text-[11px] border-border/60"
            onClick={() => window.open(`/spj/${spjId}/laporan/print`, '_blank')}
            disabled={rosterSorted.length === 0}>
            <Printer className="w-3.5 h-3.5 mr-2" /> PREVIEW PDF
          </Button>
          <Button
            size="sm"
            className="rounded-lg h-9 px-6 font-bold text-[11px] shadow-sm"
            onClick={onSave}
            disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
            SIMPAN
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* 2. Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-xl border-border/40 shadow-none bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
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
                  className="h-10 rounded-lg text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/40 shadow-none bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Pelaksana
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rosterSorted.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50">
                  <div className="text-sm font-semibold truncate leading-none">
                    {i + 1}. {p.nama}
                  </div>
                  <Badge
                    variant={p.role === 'KEPALA_JALAN' ? 'default' : 'secondary'}
                    className="text-[8px] font-bold uppercase">
                    {p.role === 'KEPALA_JALAN' ? 'Kepala' : 'Pengikut'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 3. Main Form Area */}
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
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Dasar Laporan</label>
                  <Input
                    value={dasarLaporan}
                    onChange={(e) => setDasarLaporan(e.target.value)}
                    className="h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Waktu</label>
                  <Input value={waktu} onChange={(e) => setWaktu(e.target.value)} className="h-10 rounded-lg text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Lokasi</label>
                  <Input
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    className="h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Tujuan</label>
                  <Input
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                    className="h-10 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Kegiatan</label>
                <Textarea
                  value={kegiatan}
                  onChange={(e) => setKegiatan(e.target.value)}
                  rows={3}
                  className="rounded-lg text-sm resize-none"
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
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Pembuka</label>
                    <Textarea
                      value={hasilPembuka}
                      onChange={(e) => setHasilPembuka(e.target.value)}
                      rows={2}
                      className="rounded-lg text-sm border-dashed"
                      placeholder="Setelah melakukan kegiatan..."
                    />
                  </div>

                  {hasilMode === 'POINTS' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-[10px] font-bold uppercase">Butir Hasil</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[9px] font-bold rounded-md px-2"
                          onClick={addPoin}>
                          <Plus className="w-3 h-3 mr-1" /> TAMBAH
                        </Button>
                      </div>
                      {hasilPoin.map((p, idx) => (
                        <div key={idx} className="flex gap-2 group items-start">
                          <Textarea
                            value={p}
                            onChange={(e) => updatePoin(idx, e.target.value)}
                            placeholder={`Poin ${idx + 1}`}
                            rows={2}
                            className="min-h-[40px] text-sm rounded-lg resize-none"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removePoin(idx)}
                            disabled={hasilPoin.length <= 1}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Narasi</label>
                      <Textarea
                        value={hasilNarasi}
                        onChange={(e) => setHasilNarasi(e.target.value)}
                        rows={12}
                        className="rounded-lg text-sm p-4 leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
