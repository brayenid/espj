import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function terbilangId(n: number): string {
  const angka = Math.floor(Math.abs(n))

  const satuan = [
    'nol',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas'
  ]

  if (angka < 12) return satuan[angka]
  if (angka < 20) return `${satuan[angka - 10]} belas`
  if (angka < 100) {
    const puluh = Math.floor(angka / 10)
    const sisa = angka % 10
    return sisa === 0 ? `${satuan[puluh]} puluh` : `${satuan[puluh]} puluh ${satuan[sisa]}`
  }
  if (angka < 200) return angka === 100 ? 'seratus' : `seratus ${terbilangId(angka - 100)}`
  if (angka < 1000) {
    const ratus = Math.floor(angka / 100)
    const sisa = angka % 100
    return sisa === 0 ? `${satuan[ratus]} ratus` : `${satuan[ratus]} ratus ${terbilangId(sisa)}`
  }
  if (angka < 2000) return angka === 1000 ? 'seribu' : `seribu ${terbilangId(angka - 1000)}`
  if (angka < 10000) {
    const ribu = Math.floor(angka / 1000)
    const sisa = angka % 1000
    return sisa === 0 ? `${satuan[ribu]} ribu` : `${satuan[ribu]} ribu ${terbilangId(sisa)}`
  }

  // fallback kalau di luar range (optional)
  return String(n)
}
