/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/offline-db.ts
import Dexie, { type Table } from 'dexie'

export interface OfflineQueue {
  id: string // Primary Key (biasanya SPJ ID)
  type: 'TELAAHAN' | 'SURAT_TUGAS' | 'SPD' | 'LAPORAN' | 'DOPD' | 'KUITANSI'
  payload: any // Data lengkap hasil form
  synced: number // 0 = Pending, 1 = Berhasil Sinkron
  updatedAt: number // Timestamp untuk resolusi konflik
}

// src/lib/offline-db.ts
export class SipadinOfflineDB extends Dexie {
  offlineQueue!: Table<OfflineQueue>
  spjMirror!: Table<any> // Menyimpan salinan data dari Supabase

  constructor() {
    super('SipadinOfflineDB')
    this.version(2).stores({
      offlineQueue: 'id, type, synced, updatedAt',
      spjMirror: 'id, updatedAt' // Indeks ID untuk pembacaan cepat
    })
  }
}
export const db = new SipadinOfflineDB()
