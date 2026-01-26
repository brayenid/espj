import Link from 'next/link'
import { auth } from '@/auth'
import { ArrowRight, LayoutDashboard, Users, Contact2, FileStack, LogIn, ShieldCheck, ArrowUpRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'SIPADIN - Bagian Organisasi',
  description:
    'Sistem Digitalisasi Administrasi dan Dokumen Perjalanan Dinas Bagian Organisasi Sekretariat Daerah Kabupaten Kutai Barat.'
}

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session

  return (
    <main className="relative min-h-screen bg-slate-50 font-sans selection:bg-slate-900 selection:text-white overflow-x-hidden">
      {/* --- BACKGROUND ACCENT --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Dot Pattern yang lebih halus dan bersih */}
        <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[20px_20px] mask-[radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />

        {/* Ambient Gradient light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-100/50 blur-[100px] rounded-full opacity-50" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-12">
        {/* --- HEADER --- */}
        <header className="sticky top-0 z-50 mt-4 rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md px-6 py-4 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-md">
                <FileStack className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold tracking-tight text-slate-900">SIPADIN</span>
                <span className="text-[10px] font-medium text-slate-500 hidden sm:inline-block">Bagian Organisasi</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Button
                  asChild
                  size="sm"
                  className="h-9 rounded-full bg-slate-900 text-xs font-bold shadow-lg hover:bg-slate-800 hover:shadow-slate-900/20 px-6">
                  <Link href="/spj">
                    Ruang Kerja <LayoutDashboard className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 px-6 border border-slate-200">
                  <Link href="/login">
                    <LogIn className="w-3.5 h-3.5 mr-2" /> Masuk
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* --- HERO SECTION --- */}
        <section className="mt-20 md:mt-32 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ShieldCheck className="h-3 w-3" /> Sistem Pengarsipan
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
            SIPADIN <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-slate-900 via-blue-800 to-slate-900">
              Si Paling Dinas.
            </span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-600 leading-relaxed max-w-xl font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Portal digitalisasi dokumen SPJ dan arsip perjalanan dinas Bagian Organisasi Setda Kutai Barat. Cepat,
            Terstruktur, Akuntabel.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-slate-900 px-8 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300">
              <Link href={isLoggedIn ? '/spj' : '/login'}>
                {isLoggedIn ? 'Buka Dashboard' : 'Mulai Akses'} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            {!isLoggedIn && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-full border-slate-200 bg-white px-8 text-xs font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all">
                <Link href="/panduan">
                  Panduan <ArrowUpRight className="ml-2 h-4 w-4 text-slate-400" />
                </Link>
              </Button>
            )}
          </div>
        </section>

        {/* --- FEATURE CARDS --- */}
        <section className="mt-32 pb-20 grid gap-6 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <QuickLink
            href="/spj"
            icon={<FileStack className="h-5 w-5" />}
            title="E-SPJ System"
            desc="Generator otomatis untuk Surat Tugas, SPD, Kuitansi, hingga Laporan Hasil."
            colorClass="text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
            bgHover="group-hover:border-blue-200"
          />
          <QuickLink
            href="/pegawai"
            icon={<Contact2 className="h-5 w-5" />}
            title="Database Pegawai"
            desc="Manajemen data aparatur, golongan, dan jabatan struktural secara terpusat."
            colorClass="text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
            bgHover="group-hover:border-emerald-200"
          />
          <QuickLink
            href="/users"
            icon={<Users className="h-5 w-5" />}
            title="User Control"
            desc="Pengaturan hak akses pengguna dan validasi keamanan dokumen."
            colorClass="text-orange-600 group-hover:bg-orange-600 group-hover:text-white"
            bgHover="group-hover:border-orange-200"
          />
        </section>

        {/* --- FOOTER --- */}
        <footer className="border-t border-slate-200 py-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-900">SIPADIN</div>
              <div className="text-[10px] text-slate-500 mt-1">Si Paling Dinas</div>
            </div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              © {new Date().getFullYear()} Bagian Organisasi Setda Kab. Kutai Barat
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

function QuickLink({
  href,
  icon,
  title,
  desc,
  colorClass,
  bgHover
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
  colorClass: string
  bgHover: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1',
        bgHover
      )}>
      <div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 transition-all duration-300',
            colorClass
          )}>
          {icon}
        </div>
        <h3 className="mt-6 text-sm font-bold text-slate-900 group-hover:text-foreground transition-colors">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">{desc}</p>
      </div>

      <div className="mt-8 flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
        Akses Menu <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
