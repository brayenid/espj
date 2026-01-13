import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SpjMaster from '@/components/spj/spj-master'
import { ChevronRight, Home } from 'lucide-react'
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
      {/* Breadcrumb ala Linear */}
      <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
        <Link href="/spj" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home className="w-3 h-3" /> Dashboard
        </Link>
        <ChevronRight className="w-3 h-3 opacity-50" />
        <span className="text-foreground font-mono">{spj.id.slice(0, 8)}...</span>
      </nav>

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
