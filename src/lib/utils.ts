import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fungsi internal untuk mengubah angka menjadi teks (Bahasa Indonesia)
 */
function terbilang(n: number): string {
  const x = Math.floor(Math.abs(n || 0))
  const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']

  if (x === 0) return 'nol'
  if (x < 12) return s[x]
  if (x < 20) return `${s[x - 10]} belas`

  if (x < 100) {
    const puluh = Math.floor(x / 10)
    const satuan = x % 10
    return `${s[puluh]} puluh${satuan ? ' ' + s[satuan] : ''}`
  }

  if (x < 200) {
    return `seratus${x % 100 ? ' ' + terbilang(x - 100) : ''}`
  }

  if (x < 1000) {
    const ratusan = Math.floor(x / 100)
    const sisa = x % 100
    // Menggunakan s[ratusan] agar menghasilkan "dua ratus", bukan "dua puluh ratus"
    return `${s[ratusan]} ratus${sisa ? ' ' + terbilang(sisa) : ''}`
  }

  return String(x)
}

/**
 * Menghasilkan teks format: "3 (tiga) Hari"
 * Digunakan untuk label pada dokumen SPJ/SPD.
 */
export function terbilangId(n: number) {
  const v = Math.max(0, Math.floor(Number(n) || 0))
  if (v === 0) return `0 (nol) Hari`
  return `${v} (${terbilang(v)}) Hari`
}

/**
 * Helper Fungsi untuk menghitung selisih murni (Non-Inklusif)
 */
export function calculateDiffDays(startDate: Date, endDate: Date): number {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)

  // Set ke jam 0 agar perbedaan waktu (jam/menit) tidak mengacaukan hitungan hari
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1

  return Math.max(0, diffDays)
}

export function fmtDateId(d: Date | string) {
  if (!d) return ''
  try {
    const date = new Date(d)

    // Pastikan valid date
    if (isNaN(date.getTime())) return ''

    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      // KUNCI UTAMA: Paksa timezone agar server & client sama
      timeZone: 'Asia/Kuala_Lumpur'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

/**
 * Helpers untuk standarisasi format nomor dokumen SPJ
 * Lokasi: @/lib/number-generators.ts (atau sesuai struktur Anda)
 */

/**
 * Mengonversi angka bulan (0-11) menjadi Angka Romawi
 */
function getRomanMonth(monthIndex: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return romans[monthIndex] ?? 'I'
}

export const SpjNumberGenerator = {
  /**
   * Format: 000.8 /         /Org-TU.P/I/2026
   */
  generateTelaahan: () => {
    const now = new Date()
    const month = getRomanMonth(now.getMonth())
    const year = now.getFullYear()

    return `000.8 /         /Org-TU.P/${month}/${year}`
  },

  /**
   * Format: 800.1.11.1/        /Org-Tu.P/I/2026
   */
  generateSuratTugas: () => {
    const now = new Date()
    const month = getRomanMonth(now.getMonth())
    const year = now.getFullYear()

    return `800.1.11.1/        /Org-Tu.P/${month}/${year}`
  },

  /**
   * Format: 000.1.2.3/           /SPPD/I/2026
   */
  generateSpd: () => {
    const now = new Date()
    const month = getRomanMonth(now.getMonth())
    const year = now.getFullYear()

    return `000.1.2.3/           /SPPD/${month}/${year}`
  }
}
