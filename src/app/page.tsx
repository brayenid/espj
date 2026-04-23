import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SIPADIN - Bagian Organisasi',
  description:
    'Sistem Digitalisasi Administrasi dan Dokumen Perjalanan Dinas Bagian Organisasi Sekretariat Daerah Kabupaten Kutai Barat.'
}

export default async function HomePage() {
  const session = await auth()
  
  if (session) {
    redirect('/spj')
  } else {
    redirect('/login')
  }
}
