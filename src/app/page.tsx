import Link from 'next/link'
import { auth } from '@/auth'
import { ArrowRight, LayoutDashboard, Users, Contact2, FileStack, LogIn, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SIPADIN - Bagian Organisasi',
  description:
    'Sistem Digitalisasi Administrasi dan Dokumen Perjalanan Dinas Bagian Organisasi Sekretariat Daerah Kabupaten Kutai Barat.'
}

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session

  return (
    <main className="relative min-h-screen bg-[#fafafa] font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Grid Background Accent */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#fafafa]/50 to-[#fafafa]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8 md:px-12">
        {/* Simple Top Nav */}
        <header className="flex items-center justify-between border-b border-black/6 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground shadow-lg shadow-black/10 transition-transform hover:scale-105">
              <FileStack className="h-5 w-5 text-background" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight uppercase">Sipadin</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground leading-none mt-1 hidden sm:block">
                Si Paling Dinas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Button asChild className="rounded-lg text-[10px] font-bold uppercase tracking-wider h-9 px-5 shadow-sm">
                <Link href="/spj">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-2" /> Ruang Kerja
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="rounded-lg text-[10px] font-bold uppercase tracking-wider h-9 px-5 border-black/8 bg-white/50 backdrop-blur-sm">
                <Link href="/login">
                  <LogIn className="w-3.5 h-3.5 mr-2" /> Autentikasi
                </Link>
              </Button>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="mt-28 md:mt-36 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 backdrop-blur-md px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm">
            <ShieldCheck className="h-3 w-3" /> Generator dan Arsip
          </div>

          <h1 className="mt-8 text-5xl font-black tracking-tighter text-foreground md:text-7xl lg:text-8xl leading-[0.9]">
            Sipadin <br />
            <span className="text-muted-foreground/40 font-light">Si Paling Dinas.</span>
          </h1>

          <p className="mt-8 text-base leading-relaxed text-muted-foreground md:text-lg max-w-xl font-medium">
            Portal generator dokumen SPJ dan pengarsipan digital Perjalanan Dinas Bagian Organisasi Sekretariat Daerah
            Kabupaten Kutai Barat.
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full px-10 font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20 h-14">
              <Link href={isLoggedIn ? '/spj' : '/login'}>
                {isLoggedIn ? 'Ruang Kerja' : 'Mulai Sekarang'} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Feature Cards / Quick Links */}
        <section className="mt-32 grid gap-4 sm:grid-cols-3">
          <QuickLink
            href="/spj"
            icon={<FileStack className="h-5 w-5" />}
            title="Sistem SPJ"
            desc="Pembuatan kuitansi, surat tugas, SPD, dan laporan hasil secara otomatis."
          />
          <QuickLink
            href="/pegawai"
            icon={<Contact2 className="h-5 w-5" />}
            title="Master Data"
            desc="Manajemen basis data pegawai, jabatan, dan pangkat yang mutakhir."
          />
          <QuickLink
            href="/users"
            icon={<Users className="h-5 w-5" />}
            title="Akses Kontrol"
            desc="Manajemen hak akses pengguna dan keamanan dokumen internal."
          />
        </section>

        {/* Footer */}
        <footer className="mt-40 border-t border-black/6 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Sipadin System</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                © 2026 Bagian Organisasi - SETDA Kab. Kutai Barat
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-black/6 bg-white/50 backdrop-blur-sm p-8 transition-all hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-black/3 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        {icon}
      </div>
      <h3 className="mt-6 text-xs font-black tracking-widest uppercase text-foreground">{title}</h3>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground font-medium">{desc}</p>

      {/* Decorative Gradient Hover */}
      <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/3 rounded-full blur-3xl group-hover:bg-primary/8 transition-colors" />
    </Link>
  )
}
