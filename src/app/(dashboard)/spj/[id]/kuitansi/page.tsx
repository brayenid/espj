// src/app/(dashboard)/spj/[id]/kuitansi/page.tsx
import { prisma } from '@/lib/prisma'
import KuitansiForm from '@/components/spj/kuitansi-form'
import type { SpjDocType } from '@prisma/client'

function groupKategori(items: Array<{ kategori: string; total: number }>) {
  const map = new Map<string, number>()
  for (const it of items ?? []) {
    const k = (it.kategori ?? '').trim() || 'Lain-lain'
    map.set(k, (map.get(k) ?? 0) + (it.total ?? 0))
  }
  return [...map.entries()].map(([label, jumlah]) => ({ label, jumlah })).sort((a, b) => a.label.localeCompare(b.label))
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: spjId } = await params

  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    include: {
      kuitansi: true,
      roster: { orderBy: [{ role: 'asc' }, { order: 'asc' }] },
      rincian: true,
      signers: {
        where: { docType: 'KUITANSI' as SpjDocType },
        orderBy: [{ order: 'asc' }]
      }
    }
  })

  if (!spj) {
    return <div className="p-6 text-sm text-muted-foreground">SPJ tidak ditemukan.</div>
  }

  const rosterSorted = [...(spj.roster ?? [])].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'KEPALA_JALAN' ? -1 : 1
    return a.order - b.order
  })

  const kepala = rosterSorted.find((r) => r.role === 'KEPALA_JALAN') ?? rosterSorted[0] ?? null

  const rincianKategori = groupKategori((spj.rincian ?? []).map((x) => ({ kategori: x.kategori, total: x.total })))

  const initialSigners = (spj.signers ?? []).map((s) => ({
    order: s.order,
    pegawaiId: s.pegawaiId ?? null,
    nama: s.nama,
    nip: s.nip ?? null
  }))

  const initialAnggaran = {
    tahunAnggaran: spj.tahunAnggaran ?? '',
    kodeKegiatan: spj.kodeKegiatan ?? '',
    judulKegiatan: spj.judulKegiatan ?? '',
    kodeSubKegiatan: spj.kodeSubKegiatan ?? '',
    judulSubKegiatan: spj.judulSubKegiatan ?? '',
    upGu: spj.upGu ?? '',
    nomorBku: spj.nomorBku ?? '',
    kodeRekening: spj.kodeRekening ?? '',
    judulRekening: spj.judulRekening ?? ''
  }

  return (
    <div className="space-y-6">
      <KuitansiForm
        spjId={spjId}
        initialTanggalKuitansi={spj.kuitansi?.tanggalKuitansi ?? null}
        penerima={kepala ? { nama: kepala.nama, nip: kepala.nip ?? null, jabatan: kepala.jabatan } : null}
        rincian={rincianKategori}
        initialSigners={initialSigners}
        initialAnggaran={initialAnggaran}
      />
    </div>
  )
}
