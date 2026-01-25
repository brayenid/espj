/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/spj/spj-hydrator.tsx
'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/offline-db'
import SpjMaster from '@/components/spj/spj-master'
import { Loader2, WifiOff, Database } from 'lucide-react'

export default function SpjHydrator({ serverData, spjId }: { serverData: any; spjId: string }) {
  const [data, setData] = useState(serverData)
  const [dataSource, setDataSource] = useState<'server' | 'local-queue' | 'local-mirror' | null>(null)
  const [loading, setLoading] = useState(!serverData)

  useEffect(() => {
    async function findData() {
      // 1. Cek Data Server (Online)
      if (serverData) {
        setData(serverData)
        setDataSource('server')
        setLoading(false)
        return
      }

      // 2. Cek Antrean Offline (Mutasi yang belum sinkron)
      const offlineEntry = await db.offlineQueue.get(spjId)
      if (offlineEntry) {
        setData({ ...offlineEntry.payload, id: offlineEntry.id, isLocal: true })
        setDataSource('local-queue')
        setLoading(false)
        return
      }

      // 3. Cek Mirror (Cache data lama dari server)
      const mirroredData = await db.spjMirror.get(spjId)
      if (mirroredData) {
        setData(mirroredData)
        setDataSource('local-mirror')
        setLoading(false)
        return
      }

      setLoading(false)
    }

    findData()
  }, [serverData, spjId])

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    )
  if (!data) return <div>Data tidak ditemukan di server maupun lokal.</div>

  return (
    <div className="space-y-4">
      {dataSource !== 'server' && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-50 p-4 text-blue-700">
          {dataSource === 'local-queue' ? <WifiOff className="w-4 h-4" /> : <Database className="w-4 h-4" />}
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {dataSource === 'local-queue' ? 'Menampilkan Draf Offline' : 'Menampilkan Data dari Cache Lokal'}
          </span>
        </div>
      )}

      <SpjMaster spj={data} roster={data.roster || []} signers={data.signers || []} docs={data.docs || {}} />
    </div>
  )
}
