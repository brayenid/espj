/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

import SpjMetaForm from '@/components/spj/forms/spj-meta-form'
import PdfPreviewDialog from '@/components/shared/pdf-preview-dialog'
import {
  Calendar,
  Edit3,
  FileDown,
  FileText,
  Info,
  Users,
  PenTool,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  Clock,
  Landmark,
  Link2,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { fmtDateId } from '@/lib/utils'

// --- Types ---
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

type SignerItem = {
  id: string
  docType: 'TELAAHAN_STAF' | 'SURAT_TUGAS' | 'SPD' | 'DOPD' | 'KUITANSI' | 'VISUM' | 'LAPORAN'
  order: number
  roleKey: string
  nama: string
  nip: string | null
  jabatan: string
  jabatanTampil: string | null
}

type SpjLite = {
  id: string
  createdAt: Date
  updatedAt: Date
  noTelaahan: string | null
  noSuratTugas: string | null
  noSpd: string | null
  kotaTandaTangan: string
  tglSuratTugas: Date
  tglSpd: Date
  tglBerangkat: Date
  tglKembali: Date
  lamaPerjalanan: number
  tempatBerangkat: string
  tempatTujuan: string
  maksudDinas: string
  pencairan: boolean
  alatAngkut: string
  tahunAnggaran: string | null
  kodeKegiatan: string | null
  judulKegiatan: string | null
  kodeSubKegiatan: string | null
  judulSubKegiatan: string | null
  upGu: string | null
  nomorBku: string | null
  kodeRekening: string | null
  judulRekening: string | null
  akunAnggaran: string | null
  buktiDukungUrl: string | null
  tingkatPerjalanan: string | null
}

type PdfKey = 'SPD' | 'DOPD' | 'KUITANSI' | 'VISUM' | 'LAPORAN' | 'TS' | 'ST'

// --- Helpers ---

function safe(s?: string | null, fb = '-') {
  const t = (s ?? '').trim()
  return t.length ? t : fb
}

export default function SpjMaster({
  spj,
  roster,
  signers,
  docs
}: {
  spj: SpjLite
  roster: RosterItem[]
  signers: SignerItem[]
  docs: {
    telaahan: boolean
    suratTugas: boolean
    visum: boolean
    kuitansi: boolean
    laporan: boolean
    dopd: boolean
  }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Logic: Roster Sorting
  const rosterSorted = useMemo(() => {
    return [...(roster ?? [])].sort((a, b) => {
      if (a.role !== b.role) return a.role === 'KEPALA_JALAN' ? -1 : 1
      return a.order - b.order
    })
  }, [roster])

  const kepala = rosterSorted.find((r) => r.role === 'KEPALA_JALAN') ?? rosterSorted[0] ?? null
  const pengikut = rosterSorted.filter((r) => r.role === 'PENGIKUT')

  // Logic: Signer Grouping
  const signerMap = useMemo(() => {
    const map = new Map<string, SignerItem[]>()
    for (const s of signers) {
      const arr = map.get(s.docType) ?? []
      arr.push(s)
      map.set(s.docType, arr)
    }
    for (const [k, arr] of map) {
      map.set(
        k,
        [...arr].sort((a, b) => a.order - b.order)
      )
    }
    return map
  }, [signers])

  // UI States
  const [open, setOpen] = useState<null | 'META' | 'SIGNERS' | 'DELETE'>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfKey, setPdfKey] = useState<PdfKey | null>(null)

  const close = () => setOpen(null)

  const pdfItems = useMemo(() => {
    const base = `/spj/${spj.id}`
    return [
      { key: 'TS' as const, label: 'Telaahan ', url: `${base}/telaahan/print` },
      { key: 'SPD' as const, label: 'SPD', url: `${base}/spd/print` },
      { key: 'ST' as const, label: 'Surat Tugas', url: `${base}/surat-tugas/print` },
      { key: 'DOPD' as const, label: 'DOPD', url: `${base}/dopd/print` },
      { key: 'KUITANSI' as const, label: 'Kuitansi', url: `${base}/kuitansi/print` },
      { key: 'VISUM' as const, label: 'Visum', url: `${base}/visum/print` },
      { key: 'LAPORAN' as const, label: 'Laporan', url: `${base}/laporan/print` }
    ]
  }, [spj.id])

  const currentPdf = useMemo(() => {
    if (!pdfKey) return null
    return pdfItems.find((x) => x.key === pdfKey) ?? null
  }, [pdfItems, pdfKey])

  function openPdf(k: PdfKey) {
    setPdfKey(k)
    setPdfOpen(true)
  }

  // Action: Delete
  async function onDelete() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/spj/${spj.id}`, { method: 'DELETE' })
        const data = await res.json()

        if (!res.ok || !data.ok) {
          throw new Error(data.message || 'Gagal menghapus data')
        }

        toast.success('SPJ Berhasil dihapus')
        router.push('/spj')
        router.refresh()
      } catch (err: any) {
        toast.error(err.message)
      } finally {
        close()
      }
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/20 p-5 rounded-xl border border-border/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight leading-none">Master File</h2>
            <p className="text-xs font-mono text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">ID</span>{' '}
              <span className="max-w-40 truncate">{spj.id}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {pdfItems.map((item) => (
            <Button
              key={item.key}
              variant="outline"
              size="sm"
              className="h-9 border-border/60 hover:bg-background shadow-none text-xs font-medium cursor-pointer"
              onClick={() => openPdf(item.key)}>
              <FileDown className="w-3.5 h-3.5 mr-2 opacity-60" />
              {item.label}
            </Button>
          ))}
          <Separator orientation="vertical" className="h-9 mx-1 hidden md:block" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-xl border-border/40 bg-card/40 shadow-none overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-b border-border/40 bg-muted/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Data Perjalanan & Anggaran</CardTitle>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive text-sm hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
                  onClick={() => setOpen('DELETE')}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus SPJ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-border/60 text-sm shadow-none"
                  onClick={() => setOpen('META')}>
                  <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit Data
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Maksud Perjalanan Dinas
                  </label>
                  <p className="text-sm leading-relaxed text-foreground font-medium bg-muted/20 p-3 rounded-md border-l-2 border-primary/40">
                    {safe(spj.maksudDinas)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <Section title="Administrasi" icon={FileText}>
                    <Row label="No. Telaahan" value={spj.noTelaahan ? spj.noTelaahan : '-'} />
                    <Row label="No. Surat Tugas" value={spj.noSuratTugas ? spj.noSuratTugas : '-'} />
                    <Row label="No. SPD" value={spj.noSpd ? spj.noSpd : '-'} />
                    <Row label="Tgl Surat Tugas" value={fmtDateId(spj.tglSuratTugas)} />
                    <Row label="Tgl SPD" value={fmtDateId(spj.tglSpd)} />
                    <Row label="Kota TTD" value={spj.kotaTandaTangan ? spj.kotaTandaTangan : '-'} />
                    <Row label="Tingkat Perjalanan" value={spj.tingkatPerjalanan ? spj.tingkatPerjalanan : '-'} />
                  </Section>

                  <Section title="Waktu & Lokasi" icon={Clock}>
                    <div className="flex items-center gap-3 p-2.5 mb-2 bg-primary/5 rounded-lg border border-primary/10">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">{spj.lamaPerjalanan} Hari</span>
                    </div>
                    <Row label="Berangkat" value={fmtDateId(spj.tglBerangkat)} />
                    <Row label="Kembali" value={fmtDateId(spj.tglKembali)} />
                    <Row label="Dari" value={spj.tempatBerangkat ? spj.tempatBerangkat : '-'} />
                    <Row label="Tujuan" value={spj.tempatTujuan ? spj.tempatTujuan : '-'} />
                    <Row label="Alat Angkut" value={spj.alatAngkut ? spj.alatAngkut : '-'} />
                  </Section>

                  <Section title="Detail Anggaran" icon={Landmark} className="md:col-span-2">
                    <div className="grid md:grid-cols-2 gap-x-12">
                      <div className="space-y-1">
                        <Row label="Tahun" value={spj.tahunAnggaran ? spj.tahunAnggaran : '-'} />
                        <Row label="Kegiatan" value={spj.judulKegiatan ? spj.judulKegiatan : '-'} />
                        <Row label="Sub Kegiatan" value={spj.judulSubKegiatan ? spj.judulSubKegiatan : '-'} />
                      </div>
                      <div className="space-y-1">
                        <Row label="UP/GU" value={spj.upGu ? spj.upGu : '-'} />
                        <Row label="No. BKU" value={spj.nomorBku ? spj.nomorBku : '-'} />
                        <Row label="Kode Rekening" value={spj.kodeRekening ? spj.kodeRekening : '-'} />
                      </div>
                    </div>
                  </Section>

                  <Section title="Bukti Dukung" icon={Link2} className="md:col-span-2">
                    <div className="bg-muted/30 p-2 rounded border border-border/40 font-mono text-[11px] break-all">
                      {safe(spj.buktiDukungUrl, 'Belum ada URL bukti dukung')}
                    </div>
                  </Section>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-xl border-border/40 bg-card/40 shadow-none">
            <CardHeader className="px-5 py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4" /> Dokumen Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-2">
                <StatusBadge label="Telaahan" active={docs.telaahan} />
                <StatusBadge label="ST" active={docs.suratTugas} />
                <StatusBadge label="SPD" active={true} />
                <StatusBadge label="DOPD" active={docs.dopd} />
                <StatusBadge label="Kuitansi" active={docs.kuitansi} />
                <StatusBadge label="Visum" active={docs.visum} />
                <StatusBadge label="Laporan" active={docs.laporan} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/40 bg-card/40 shadow-none">
            <CardHeader className="px-5 py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" /> Pelaksana Perjalanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {kepala && (
                <div className="group relative p-3 rounded-lg border border-primary/20 bg-primary/5 transition-all">
                  <Badge className="absolute -top-2 right-2 h-4 text-[9px] bg-primary hover:bg-primary">
                    Kepala Jalan
                  </Badge>
                  <p className="text-xs font-bold leading-tight">{kepala.nama}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">{kepala.jabatan}</p>
                </div>
              )}
              {pengikut.map((p, idx) => (
                <div key={p.id} className="p-3 rounded-lg border border-border/40 bg-background/50">
                  <p className="text-xs font-medium leading-tight">
                    {idx + 1}. {p.nama}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">{p.jabatan}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/40 bg-card/40 shadow-none">
            <CardHeader className="px-5 py-4 border-b border-border/40 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                <PenTool className="w-4 h-4" /> Penandatangan
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setOpen('SIGNERS')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {signers.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic text-center py-4">
                  Belum ada penandatangan diatur.
                </p>
              ) : (
                Array.from(signerMap.entries())
                  .slice(0, 3)
                  .map(([type, items]) => (
                    <div key={type} className="space-y-1.5">
                      <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                        {type.replace('_', ' ')}
                      </p>
                      {items.map((s) => (
                        <p key={s.id} className="text-[11px] font-medium truncate flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-border" /> {s.nama}
                        </p>
                      ))}
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Confirm Delete Dialog */}
      <Dialog open={open === 'DELETE'} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-md border-destructive/20 shadow-2xl">
          <DialogHeader>
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle>Hapus Data SPJ?</DialogTitle>
            <DialogDescription className="text-sm">
              Tindakan ini permanen. Seluruh data terkait perjalanan dinas ini termasuk roster, penandatangan, dan
              rincian biaya akan ikut dihapus dari database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Batalkan
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90">
              {isPending ? 'Menghapus...' : 'Ya, Hapus Permanen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview */}
      <PdfPreviewDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title={currentPdf ? `Preview ${currentPdf.label}` : 'Preview PDF'}
        description={currentPdf ? `Dokumen: ${currentPdf.label}` : undefined}
        url={currentPdf?.url ?? null}
      />

      {/* META EDIT MODAL */}
      <Dialog open={open === 'META'} onOpenChange={(v) => !v && close()}>
        <DialogContent className="w-[96vw] max-w-6xl max-h-[90vh] overflow-y-auto border-border/40 shadow-2xl p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-muted/20">
            <DialogTitle className="text-lg">Konfigurasi Master SPJ</DialogTitle>
            <DialogDescription className="text-xs">Update metadata utama perjalanan dinas ini.</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <SpjMetaForm
              spjId={spj.id}
              initial={spj}
              onSaved={() => {
                close()
                router.refresh()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* SIGNERS VIEW MODAL */}
      <Dialog open={open === 'SIGNERS'} onOpenChange={(v) => !v && close()}>
        <DialogContent className="w-[96vw] max-w-4xl max-h-[85vh] overflow-y-auto border-border/40 p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-muted/20">
            <DialogTitle>Daftar Penandatangan</DialogTitle>
            <DialogDescription className="text-xs">
              Ringkasan penandatangan untuk setiap jenis dokumen
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {Array.from(signerMap.entries()).map(([docType, arr]) => (
              <div key={docType} className="rounded-lg border border-border/50 overflow-hidden">
                <div className="bg-muted/30 px-3 py-2 text-[10px] font-bold uppercase tracking-widest border-b border-border/50 flex justify-between">
                  <span>{docType}</span>
                  <span className="text-muted-foreground">{arr.length} Penandatangan</span>
                </div>
                <div className="divide-y divide-border/30">
                  {arr.map((s) => (
                    <div key={s.id} className="p-3 bg-background/50 hover:bg-muted/10 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-foreground">{s.nama}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{s.nip ?? 'Tanpa NIP'}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] h-4 font-mono">
                          Order {s.order}
                        </Badge>
                      </div>
                      <div className="mt-2 text-[10px] text-muted-foreground flex gap-2 italic">
                        <span className="font-bold not-italic text-foreground/70">Role Key: {s.roleKey}</span>|{' '}
                        {s.jabatanTampil ?? s.jabatan}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Internal UI Components ---

function Section({
  title,
  icon: Icon,
  children,
  className
}: {
  title: string
  icon: any
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3 h-3 text-muted-foreground/70" />
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{title}</h4>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | number }) {
  return (
    <div className="flex justify-between items-center text-xs py-1.5 border-b border-border/5 last:border-0 hover:bg-muted/5 px-1 transition-colors">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground tabular-nums text-right max-w-[200px] truncate">
        {safe(String(value))}
      </span>
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
