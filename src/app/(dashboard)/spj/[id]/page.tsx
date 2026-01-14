import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SpjMaster from '@/components/spj/spj-master'
import { ChevronRight, Home, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'

type PageProps = {
  params: { id: string } | Promise<{ id: string }>
}

export default async function SpjMasterPage(props: PageProps) {
  const params = await props.params
  const spjId = params?.id

  if (!spjId) return notFound()

  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    include: {
      roster: { orderBy: [{ order: 'asc' }] },
      signers: { orderBy: [{ docType: 'asc' }, { order: 'asc' }] },
      visum: true,
      kuitansi: true,
      laporan: true,
      telaahan: true,
      spjSuratTugas: true,
      rincian: true
    }
  })

  if (!spj) return notFound()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Link href="/spj" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home className="w-3 h-3" /> Dashboard
        </Link>
        <ChevronRight className="w-3 h-3 opacity-50" />
        <span className="text-foreground font-mono">{spj.id.slice(0, 8)}...</span>
      </nav>

      {/* 2. Kondisional Banner Notifikasi Status Pencairan */}
      {spj.pencairan ? (
        // Banner SUDAH Cair
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                Sudah Dicairkan
              </h3>
              <p className="text-xs text-emerald-600/80 leading-relaxed">
                Administrasi keuangan telah selesai. Data biaya terkunci untuk menjaga konsistensi laporan keuangan.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Banner BELUM Cair
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-50 p-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-800">Menunggu Pencairan</h3>
              <p className="text-xs text-amber-800/80 leading-relaxed">
                SPJ ini belum tercatat cair. Jika dana sudah diterima, silakan tekan tombol{' '}
                <span className="font-bold underline">Edit Data</span> di bagian bawah untuk memperbarui status
                pencairan.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
              <Info className="w-3 h-3 text-amber-800" />
              <span className="text-[10px] font-bold text-amber-600 uppercase">Input Required</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. SpjMaster */}
      <SpjMaster
        spj={{
          id: spj.id,
          createdAt: spj.createdAt,
          updatedAt: spj.updatedAt,
          noTelaahan: spj.noTelaahan ?? null,
          noSuratTugas: spj.noSuratTugas ?? null,
          noSpd: spj.noSpd ?? null,
          kotaTandaTangan: spj.kotaTandaTangan,
          tglSuratTugas: spj.tglSuratTugas,
          tglSpd: spj.tglSpd,
          tglBerangkat: spj.tglBerangkat,
          tglKembali: spj.tglKembali,
          lamaPerjalanan: spj.lamaPerjalanan,
          tempatBerangkat: spj.tempatBerangkat,
          tempatTujuan: spj.tempatTujuan,
          maksudDinas: spj.maksudDinas,
          pencairan: spj.pencairan,
          alatAngkut: spj.alatAngkut,
          tahunAnggaran: spj.tahunAnggaran ?? null,
          kodeKegiatan: spj.kodeKegiatan ?? null,
          judulKegiatan: spj.judulKegiatan ?? null,
          kodeSubKegiatan: spj.kodeSubKegiatan ?? null,
          judulSubKegiatan: spj.judulSubKegiatan ?? null,
          upGu: spj.upGu ?? null,
          nomorBku: spj.nomorBku ?? null,
          kodeRekening: spj.kodeRekening ?? null,
          judulRekening: spj.judulRekening ?? null,
          akunAnggaran: spj.akunAnggaran ?? null,
          buktiDukungUrl: spj.buktiDukungUrl ?? null,
          tingkatPerjalanan: spj.tingkatPerjalanan ?? null
        }}
        roster={spj.roster}
        signers={spj.signers}
        docs={{
          telaahan: !!spj.telaahan,
          suratTugas: !!spj.spjSuratTugas,
          visum: !!spj.visum,
          kuitansi: !!spj.kuitansi,
          laporan: !!spj.laporan,
          dopd: spj.rincian.length > 0
        }}
      />
    </div>
  )
}
