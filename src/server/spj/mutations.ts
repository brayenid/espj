'use server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createSpjDraftSchema } from './schemas'

function toDate(value: string) {
  // value from <input type="date"> => "YYYY-MM-DD"
  // treat as local date; create Date at 00:00 local
  const [y, m, d] = value.split('-').map((v) => Number(v))
  return new Date(y, m - 1, d)
}

function diffDaysInclusive(start: Date, end: Date) {
  // Pastikan input adalah objek Date yang valid
  const dStart = new Date(start)
  const dEnd = new Date(end)

  // Reset jam ke 00:00:00 agar selisih jam tidak mengacaukan pembulatan hari
  dStart.setHours(0, 0, 0, 0)
  dEnd.setHours(0, 0, 0, 0)

  const ms = dEnd.getTime() - dStart.getTime()

  // Menggunakan Math.round untuk menangani floating point precision
  const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1

  // Kembalikan selisih murni (tanpa +1)
  return Math.max(days, 0)
}

export async function createSpjDraft(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const parsed = createSpjDraftSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, message: 'Validasi gagal', issues: parsed.error.issues }
  }

  const data = parsed.data

  const tglBerangkat = toDate(data.tglBerangkat)
  const tglKembali = toDate(data.tglKembali)

  // ✅ default tanggal surat tugas & spd ke tglBerangkat kalau belum diisi
  const tglSuratTugas = data.tglSuratTugas ? toDate(data.tglSuratTugas) : tglBerangkat
  const tglSpd = data.tglSpd ? toDate(data.tglSpd) : tglBerangkat

  const spj = await prisma.spj.create({
    data: {
      createdById: session.user.id,

      tempatTujuan: data.tempatTujuan,
      maksudDinas: data.maksudDinas,
      alatAngkut: data.alatAngkut ?? 'Darat',
      tempatBerangkat: data.tempatBerangkat ?? 'Sendawar',
      kotaTandaTangan: data.kotaTandaTangan ?? 'Sendawar',

      tglBerangkat,
      tglKembali,
      lamaPerjalanan: diffDaysInclusive(tglBerangkat, tglKembali),

      // ✅ tidak wajib input lagi, tapi tetap tersimpan valid di DB
      tglSuratTugas,
      tglSpd,

      noSuratTugas: data.noSuratTugas || null,
      noSpd: data.noSpd || null,
      noTelaahan: data.noTelaahan || null
    },
    select: { id: true }
  })

  return { ok: true as const, id: spj.id }
}

export async function deleteSpj(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Anda harus login untuk melakukan ini.' }
    }

    const userId = session.user.id
    const role = session.user.role

    // 1. Verifikasi kepemilikan sebelum hapus (Security Check)
    const existingSpj = await prisma.spj.findUnique({
      where: { id },
      select: { createdById: true }
    })

    if (!existingSpj) {
      return { success: false, message: 'Data SPJ tidak ditemukan.' }
    }

    // Hanya pemilik atau SUPER_ADMIN yang boleh menghapus
    if (existingSpj.createdById !== userId && role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Anda tidak memiliki izin untuk menghapus SPJ ini.' }
    }

    // 2. Eksekusi Penghapusan
    // Cascade delete pada schema akan mengurus tabel terkait (roster, rincian, dll)
    await prisma.spj.delete({
      where: { id }
    })

    // 3. Revalidasi cache agar daftar SPJ di UI terupdate
    revalidatePath('/spj')

    return { success: true, message: 'SPJ berhasil dihapus.' }
  } catch (error) {
    console.error('DELETE_SPJ_ERROR:', error)
    return { success: false, message: 'Terjadi kesalahan sistem saat menghapus data.' }
  }
}

export async function duplicateSpj(originalId: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Unauthorized' }

  try {
    // 1. Ambil data asli beserta SELURUH relasinya
    const source = await prisma.spj.findUnique({
      where: { id: originalId },
      include: {
        roster: true,
        rincian: { include: { factors: true } },
        signers: true,
        telaahan: true,
        visum: true,
        laporan: true,
        spjSuratTugas: true
      }
    })

    if (!source) return { ok: false, message: 'Data sumber tidak ditemukan' }

    // 2. Jalankan transaksi besar untuk Deep Copy
    const newSpj = await prisma.$transaction(async (tx) => {
      // A. Buat Master SPJ Baru
      const createdSpj = await tx.spj.create({
        data: {
          createdById: session.user.id as string,
          // Metadata (Salin)
          maksudDinas: source.maksudDinas,
          tempatTujuan: source.tempatTujuan,
          tempatBerangkat: source.tempatBerangkat,
          alatAngkut: source.alatAngkut,
          kotaTandaTangan: source.kotaTandaTangan,
          lamaPerjalanan: source.lamaPerjalanan,
          // Waktu (Salin - User nanti tinggal edit dikit)
          tglSuratTugas: source.tglSuratTugas,
          tglSpd: source.tglSpd,
          tglBerangkat: source.tglBerangkat,
          tglKembali: source.tglKembali,
          // Anggaran (Salin)
          tahunAnggaran: source.tahunAnggaran,
          kodeKegiatan: source.kodeKegiatan,
          judulKegiatan: source.judulKegiatan,
          kodeSubKegiatan: source.kodeSubKegiatan,
          judulSubKegiatan: source.judulSubKegiatan,
          upGu: source.upGu,
          kodeRekening: source.kodeRekening,
          judulRekening: source.judulRekening,
          akunAnggaran: source.akunAnggaran,
          tingkatPerjalanan: source.tingkatPerjalanan,
          // NOMOR SURAT (KOSONGKAN karena harus baru)
          noTelaahan: null,
          noSuratTugas: null,
          noSpd: null
        }
      })

      // B. Salin Roster & Simpan Mapping ID
      // Mapping: { [OldRosterId]: [NewRosterId] }
      const rosterMapping: Record<string, string> = {}

      for (const ros of source.roster) {
        const newRos = await tx.spjRosterItem.create({
          data: {
            spjId: createdSpj.id,
            pegawaiId: ros.pegawaiId,
            order: ros.order,
            role: ros.role,
            // Snapshot tetap disalin
            nama: ros.nama,
            nip: ros.nip,
            jabatan: ros.jabatan,
            pangkat: ros.pangkat,
            golongan: ros.golongan,
            instansi: ros.instansi
          }
        })
        rosterMapping[ros.id] = newRos.id
      }

      // C. Salin Rincian Biaya menggunakan Mapping Roster
      for (const item of source.rincian) {
        await tx.rincianBiayaItem.create({
          data: {
            spjId: createdSpj.id,
            rosterItemId: rosterMapping[item.rosterItemId], // Gunakan ID baru
            kategori: item.kategori,
            uraian: item.uraian,
            hargaSatuan: item.hargaSatuan,
            total: item.total,
            factors: {
              create: item.factors.map((f) => ({
                label: f.label,
                qty: f.qty,
                order: f.order
              }))
            }
          }
        })
      }

      // D. Salin Signers
      if (source.signers.length > 0) {
        await tx.spjSigner.createMany({
          data: source.signers.map((s) => ({
            spjId: createdSpj.id,
            docType: s.docType,
            order: s.order,
            roleKey: s.roleKey,
            pegawaiId: s.pegawaiId,
            nama: s.nama,
            nip: s.nip,
            jabatan: s.jabatan,
            golongan: s.golongan,
            pangkat: s.pangkat,
            instansi: s.instansi,
            jabatanTampil: s.jabatanTampil
          }))
        })
      }

      // E. Salin Dokumen Spesifik (Jika ada)
      if (source.telaahan) {
        await tx.spjTelaahanStaf.create({
          data: { ...source.telaahan, id: undefined, spjId: createdSpj.id }
        })
      }
      if (source.visum) {
        await tx.spjVisum.create({
          data: { spjId: createdSpj.id, stageCount: source.visum.stageCount }
        })
      }
      if (source.laporan) {
        const { id, spjId, ...lapData } = source.laporan
        await tx.spjLaporan.create({
          data: { ...lapData, spjId: createdSpj.id }
        })
      }

      return createdSpj
    })

    revalidatePath('/spj')
    return { ok: true, id: newSpj.id }
  } catch (error) {
    console.error(error)
    return { ok: false, message: 'Gagal menduplikasi data SPJ' }
  }
}
