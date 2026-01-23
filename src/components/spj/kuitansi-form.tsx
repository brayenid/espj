'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Banknote,
  Calendar,
  ChevronRight,
  FileCheck,
  FileSpreadsheet,
  Info,
  Loader2,
  Printer,
  Save,
  Search,
  UserCircle,
  Wallet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

type PegawaiResult = {
  id: string
  nama: string
  nip: string | null
  jabatan: string
  golongan: string | null
  pangkat: string | null
}

type AnggaranDraft = {
  tahunAnggaran: string
  kodeKegiatan: string
  judulKegiatan: string
  kodeSubKegiatan: string
  judulSubKegiatan: string
  upGu: string
  nomorBku: string
  kodeRekening: string
  judulRekening: string
}

type RincianRow = { label: string; jumlah: number }
type SignerInit = { order: number; pegawaiId: string | null; nama: string; nip: string | null }

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

function toDateInputValue(d: Date | null) {
  if (!d) return ''
  return d.toISOString().split('T')[0]
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
                <div className="text-[10px] text-muted-foreground mt-1 truncate">
                  {value.nip ?? '-'} • {value.jabatan || 'Pejabat'}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="w-4 h-4" />
                <span>Klik untuk mencari pejabat...</span>
              </div>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-[340px] p-0" align="start">
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

// --- Main Form ---

export default function KuitansiForm({
  spjId,
  initialTanggalKuitansi,
  penerima,
  rincian,
  initialSigners,
  initialAnggaran
}: {
  spjId: string
  initialTanggalKuitansi: Date | null
  penerima: { nama: string; nip: string | null; jabatan: string } | null
  rincian: RincianRow[]
  initialSigners: SignerInit[]
  initialAnggaran: AnggaranDraft
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [tanggal, setTanggal] = useState<string>(() => toDateInputValue(initialTanggalKuitansi))
  const [kpa, setKpa] = useState<PegawaiResult | null>(null)
  const [bpp, setBpp] = useState<PegawaiResult | null>(null)
  const [anggaran, setAnggaran] = useState<AnggaranDraft>(() => initialAnggaran)

  useEffect(() => {
    const s1 = initialSigners.find((s) => s.order === 1)
    const s2 = initialSigners.find((s) => s.order === 2)
    if (s1?.pegawaiId)
      setKpa({ id: s1.pegawaiId, nama: s1.nama, nip: s1.nip, jabatan: '', golongan: null, pangkat: null })
    if (s2?.pegawaiId)
      setBpp({ id: s2.pegawaiId, nama: s2.nama, nip: s2.nip, jabatan: '', golongan: null, pangkat: null })
  }, [initialSigners])

  const total = useMemo(() => rincian.reduce((acc, x) => acc + x.jumlah, 0), [rincian])

  async function onSave() {
    setSaving(true)
    try {
      const payload = {
        tanggalKuitansi: tanggal?.trim().length ? tanggal : null,
        signers: [
          { order: 1, pegawaiId: kpa?.id ?? null },
          { order: 2, pegawaiId: bpp?.id ?? null }
        ],
        spjMaster: Object.fromEntries(Object.entries(anggaran).map(([k, v]) => [k, v.trim() || null]))
      }
      const res = await fetch(`/api/spj/${spjId}/kuitansi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error()
      toast.success('Kuitansi berhasil disimpan.')
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan kuitansi.')
    } finally {
      setSaving(false)
    }
  }

  const REKENING_OPTIONS = [
    { kode: '5.1.02.04.001.00001', judul: 'Belanja Perjalanan Dinas Biasa' },
    { kode: '5.1.02.04.001.00003', judul: 'Belanja Perjalanan Dinas Dalam Kota' }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* 1. TOP SUMMARY BAR */}
      <div className="sticky top-0 z-30 -mx-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/40 sm:mx-0 sm:rounded-xl sm:border px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight uppercase text-muted-foreground/80">
                Nilai Kuitansi Final
              </h1>
              <div className="text-xl font-mono font-bold tracking-tighter">Rp {rupiah(total)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9 font-semibold text-sm border-border/60 shadow-none"
              onClick={() => window.open(`/spj/${spjId}/kuitansi/print`, '_blank')}>
              <Printer className="w-3.5 h-3.5 mr-2" /> Preview PDF
            </Button>
            <Button
              size="sm"
              className="rounded-lg h-9 px-6 font-semibold text-sm   shadow-none"
              onClick={onSave}
              disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
              Simpan Kuitansi
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* 2. LEFT COLUMN: Meta & Rincian */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-xl border-border/40 shadow-none overflow-hidden bg-card/50">
            <CardHeader className="bg-muted/10 border-b border-border/40 px-6 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" /> Rincian Penerimaan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Header Info */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-4 rounded-xl border border-border/40 bg-background/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Penerima Dana
                  </span>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{penerima?.nama ?? '-'}</div>
                      <div className="text-[11px] text-muted-foreground">{penerima?.nip ?? '-'}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="mt-3 rounded-md text-[9px] font-bold uppercase py-0.5">
                    Kepala Jalan
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                      Tanggal Kuitansi
                    </span>
                  </div>
                  <Input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="rounded-lg h-10 text-sm font-mono border-border/40 bg-background shadow-none"
                  />
                  <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                    *Kosongkan jika ingin mencetak tanpa tanggal (tulis tangan).
                  </p>
                </div>
              </div>

              {/* Rincian Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                    Item Biaya (Ditarik dari DOPD)
                  </span>
                </div>
                <div className="rounded-xl border border-border/40 bg-background overflow-hidden">
                  <div className="divide-y divide-border/40">
                    {rincian.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-5 py-3 hover:bg-muted/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-muted-foreground">{idx + 1}.</span>
                          <span className="text-sm font-medium">{r.label}</span>
                        </div>
                        <span className="text-sm font-mono font-bold">Rp {rupiah(r.jumlah)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-5 py-4 bg-muted/20 border-t-2 border-border/40">
                      <span className="text-xs font-bold uppercase tracking-widest">Jumlah Sebesar</span>
                      <span className="text-base font-mono font-bold text-primary">Rp {rupiah(total)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-primary/3 rounded-lg border border-primary/10">
                  <Info className="w-3.5 h-3.5 text-primary mt-0.5" />
                  <p className="text-[12px] text-primary/80 leading-relaxed">
                    Rincian ini dikelompokkan berdasarkan kategori biaya pada DOPD. Jika ingin mengubah angka, silakan
                    ubah pada menu <strong>DOPD</strong>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. SIGNERS AREA */}
          <Card className="rounded-xl border-border/40 shadow-none bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-primary" /> Otorisasi Kuitansi
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <SignerCombobox label="Kuasa Pengguna Anggaran (KPA)" value={kpa} onChange={setKpa} />
              <SignerCombobox label="Bendahara Pengeluaran Pembantu" value={bpp} onChange={setBpp} />
            </CardContent>
          </Card>
        </div>

        {/* 4. RIGHT COLUMN: Anggaran (SPJ Master) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-xl border-border/40 shadow-none sticky top-24">
            <CardHeader className="bg-muted/10 border-b border-border/40 px-6 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                <FileSpreadsheet className="w-4 h-4" /> Data Anggaran
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Tahun Anggaran</label>
                  <Input
                    value={anggaran.tahunAnggaran}
                    onChange={(e) => setAnggaran({ ...anggaran, tahunAnggaran: e.target.value })}
                    className="h-9 rounded-lg text-xs bg-white shadow-none"
                    placeholder="Masukan tahun anggaran"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">UP / GU / LS</label>
                  <Input
                    value={anggaran.upGu}
                    onChange={(e) => setAnggaran({ ...anggaran, upGu: e.target.value })}
                    className="h-9 rounded-lg text-xs bg-white shadow-none"
                    placeholder="Umumnya diisi oleh bendahara"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Nomor BKU</label>
                  <Input
                    value={anggaran.nomorBku}
                    onChange={(e) => setAnggaran({ ...anggaran, nomorBku: e.target.value })}
                    className="h-9 rounded-lg text-xs bg-white shadow-none"
                    placeholder="Umumnya diisi oleh bendahara"
                  />
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                      Rekening Belanja
                    </label>
                  </div>

                  <Select
                    value={anggaran.kodeRekening}
                    onValueChange={(val) => {
                      // Logika cerdas: Update kode dan judul sekaligus berdasarkan pilihan
                      const selected = REKENING_OPTIONS.find((opt) => opt.kode === val)
                      setAnggaran({
                        ...anggaran,
                        kodeRekening: val,
                        judulRekening: selected?.judul || ''
                      })
                    }}>
                    <SelectTrigger className="h-9 w-full rounded-lg text-xs bg-white shadow-none border-border/50 overflow-hidden">
                      <div className="truncate text-left">
                        <SelectValue placeholder="Pilih Kode Rekening..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="z-[100] rounded-xl border-border/50 shadow-xl max-w-(--radix-select-trigger-width)">
                      {REKENING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.kode} value={opt.kode} className="text-xs">
                          <span className="font-bold">{opt.kode}</span>
                          <p className="text-[10px] text-muted-foreground truncate opacity-70">{opt.judul}</p>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Deskripsi otomatis muncul di sini (Read-only atau tetap bisa edit) */}
                  <div className="rounded-lg bg-muted/30 p-3 border border-dashed border-border/50">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {anggaran.judulRekening || 'Judul rekening akan muncul otomatis setelah kode dipilih.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
