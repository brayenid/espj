import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Database, ShieldAlert } from 'lucide-react'
import Image from 'next/image'

export const metadata = {
  title: 'SIPADIN V1 - Pengalihan Sistem',
  description: 'Sistem SIPADIN V1 telah dialihkan ke versi 2 yang baru.'
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {/* Background decorative patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] pointer-events-none" />
      
      <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-2xl shadow-xl p-8 relative overflow-hidden flex flex-col items-center text-center">
        {/* Top Warning Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />

        {/* Logo Kutai Barat */}
        <div className="mb-6 relative w-20 h-20 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">
          <Image
            src="/sipadin.png"
            alt="Logo Kabupaten Kutai Barat"
            width={64}
            height={64}
            className="object-contain w-auto h-auto"
          />
        </div>

        {/* Header Icon */}
        <div className="mb-4 bg-amber-50 text-amber-600 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-amber-200/40">
          <ShieldAlert className="w-4 h-4" />
          <span>Sistem Telah Dialihkan</span>
        </div>

        {/* Title & Description */}
        <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl tracking-tight leading-snug">
          SIPADIN Versi 1 <br />
          Tidak Digunakan Lagi
        </h1>
        
        <p className="text-sm text-slate-500 mt-3.5 leading-relaxed max-w-sm">
          Sistem administrasi harian dan pembuatan SPJ perjalanan dinas Bagian Organisasi telah dialihkan ke platform <strong>SIPADIN V2</strong> yang baru.
        </p>

        {/* Main CTA Button */}
        <div className="w-full mt-8">
          <Link href="https://sipadin.vercel.app" passHref className="w-full block">
            <Button className="w-full h-12 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-indigo-600/10 group transition-all">
              Buka SIPADIN V2 (Baru)
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3 my-7 text-xs text-slate-400">
          <div className="h-px bg-slate-100 flex-1" />
          <span>ARSIP & DATA HISTORIS</span>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        {/* Secondary / Archive Button */}
        <Link href="/spj" passHref className="w-full">
          <Button variant="outline" className="w-full h-11 text-xs text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-2 font-medium">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            Akses SIPADIN V1 (Arsip & Impor)
          </Button>
        </Link>
        
        <p className="text-[10px] text-slate-400 mt-6 uppercase tracking-widest font-bold">
          Bagian Organisasi Sekretariat Daerah
        </p>
      </div>
    </div>
  )
}
