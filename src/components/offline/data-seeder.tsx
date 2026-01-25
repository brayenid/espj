/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect } from 'react'
import { db } from '@/lib/offline-db'

export default function DataSeeder({ initialSpjs }: { initialSpjs: any[] }) {
  useEffect(() => {
    async function seedData() {
      if (initialSpjs.length > 0) {
        // Simpan semua data dari server ke mirror lokal
        await db.spjMirror.bulkPut(
          initialSpjs.map((spj) => ({
            ...spj,
            isFromServer: true,
            updatedAt: Date.now()
          }))
        )
      }
    }
    seedData()
  }, [initialSpjs])

  return null
}
