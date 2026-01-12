import { listPegawai } from '@/server/pegawai/queries'
import PegawaiSpreadsheet from '@/components/pegawai/pegawai-spreadsheet'

export default async function PegawaiListPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const sp = (await searchParams) ?? {}
  const q = (sp.q ?? '').toString()

  const { items } = await listPegawai({ q })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Pegawai</h1>
        <p className="text-sm text-muted-foreground">Edit data langsung pada tabel dan klik simpan.</p>
      </div>

      <PegawaiSpreadsheet initialItems={items} />
    </div>
  )
}
