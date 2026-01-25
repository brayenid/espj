'use client'
import { useEffect } from 'react'
import { db } from '@/lib/offline-db'
import { toast } from 'sonner'

export default function SyncManager() {
  useEffect(() => {
    const handleSync = async () => {
      if (!navigator.onLine) return

      const pendingData = await db.offlineQueue.where('synced').equals(0).toArray()
      if (pendingData.length === 0) return

      // Gunakan toast.promise untuk feedback visual
      toast.promise(
        Promise.all(
          pendingData.map(async (item) => {
            let endpoint = ''
            let method = 'PUT'

            // Logika cerdas: Jika type adalah TELAAHAN (entry point awal SpjCreate)
            // maka arahkan ke endpoint POST master SPJ
            if (item.type === 'TELAAHAN') {
              endpoint = '/api/spj'
              method = 'POST'
            } else {
              // Untuk update dokumen spesifik (Laporan, SPD, dll)
              endpoint = `/api/spj/${item.id}/${item.type.toLowerCase()}`
              method = 'PUT'
            }

            const res = await fetch(endpoint, {
              method: method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...item.payload, id: item.id }) // Kirim ID asli dari IndexedDB
            })

            if (res.ok) {
              await db.offlineQueue.update(item.id, { synced: 1 })
            } else {
              throw new Error(`Gagal sinkron ${item.type}`)
            }
          })
        ),
        {
          loading: 'Menyingkronkan data offline...',
          success: 'Semua data telah sinkron ke server',
          error: (err) => `Gagal sinkron: ${err.message}`
        }
      )
    }

    // Pemicu 1: Saat koneksi kembali menyala
    window.addEventListener('online', handleSync)

    // Pemicu 2: Saat aplikasi pertama kali dimuat (jika sudah online)
    handleSync()

    return () => window.removeEventListener('online', handleSync)
  }, [])

  return null
}
