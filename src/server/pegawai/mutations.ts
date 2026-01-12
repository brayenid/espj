/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const pegawaiItemSchema = z.object({
  id: z.string(),
  nama: z.string().trim().min(1, 'Nama wajib diisi'),
  nip: z.string().trim().nullable().optional(),
  jabatan: z.string().trim().min(1, 'Jabatan wajib diisi'),
  pangkat: z.string().trim().nullable().optional(),
  golongan: z.string().trim().nullable().optional()
})

export async function syncPegawaiBatch(input: { updates: any[]; deletes: string[] }) {
  try {
    const validatedUpdates = z.array(pegawaiItemSchema).parse(input.updates)
    const validatedDeletes = z.array(z.string()).parse(input.deletes)

    // Koleksi semua perintah dalam satu array
    const operations: any[] = []

    // 1. Tambahkan operasi Delete
    if (validatedDeletes.length > 0) {
      operations.push(
        prisma.pegawai.deleteMany({
          where: { id: { in: validatedDeletes } }
        })
      )
    }

    // 2. Tambahkan operasi Create & Update
    validatedUpdates.forEach((item) => {
      const isNew = item.id.startsWith('new-')

      if (isNew) {
        operations.push(
          prisma.pegawai.create({
            data: {
              nama: item.nama,
              nip: item.nip || null,
              jabatan: item.jabatan,
              pangkat: item.pangkat || null,
              golongan: item.golongan || null,
              instansi: 'Sekretariat Daerah Kabupaten Kutai Barat'
            }
          })
        )
      } else {
        operations.push(
          prisma.pegawai.update({
            where: { id: item.id },
            data: {
              nama: item.nama,
              nip: item.nip || null,
              jabatan: item.jabatan,
              pangkat: item.pangkat || null,
              golongan: item.golongan || null
            }
          })
        )
      }
    })

    // 3. Jalankan semua sekaligus dalam satu batch transaction
    // Ini jauh lebih cepat dan mencegah timeout
    await prisma.$transaction(operations)

    revalidatePath('/pegawai')
    return { ok: true }
  } catch (error: any) {
    console.error('Batch Sync Error:', error)

    if (error?.code === 'P2002') {
      return { ok: false, message: 'Gagal: Terjadi duplikasi NIP.' }
    }

    return { ok: false, message: 'Gagal sinkronisasi data ke server.' }
  }
}
