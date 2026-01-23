import Link from 'next/link'
import { auth } from '@/auth' // Sesuaikan dengan konfigurasi NextAuth Anda
import { ArrowRight, LayoutDashboard, Users, Contact2, FileStack, LogIn, Database } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SIPADIN - Bagian Organisasi',
  description:
    'Sistem Digitalisasi Administrasi dan Dokumen Perjalanan Dinas Bagian Organisasi Sekretariat Daerah Kabupaten Kutai Barat.',
  openGraph: {
    title: 'SIPADIN System',
    description: 'Digitalisasi Dokumen Perjalanan Dinas Bagian Organisasi.',
    siteName: 'SIPADIN Organisasi',
    locale: 'id_ID',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIPADIN System',
    description: 'Digitalisasi Dokumen Perjalanan Dinas.'
  }
}

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session

  return (
    <main className="relative min-h-screen bg-[#fafafa] font-sans">
      {/* Subtle Background Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-8 md:px-12">
        {/* Simple Top Nav */}
        <header className="flex items-center justify-between border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 items-center justify-center rounded-xl bg-foreground shadow-sm hidden sm:flex">
              <FileStack className="h-5 w-5 text-background" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight uppercase">Sipadin</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mt-1 hidden sm:block">
                Si Paling Dinas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button asChild className="rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm h-9 px-5">
                <Link href="/spj">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-2" /> Dashboard
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="rounded-lg text-[10px] font-bold uppercase tracking-wider h-9 px-5 border-border/60">
                <Link href="/login">
                  <LogIn className="w-3.5 h-3.5 mr-2" /> Login Akun
                </Link>
              </Button>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="mt-24 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
            <Database className="h-3 w-3" /> Generator Berkas dan Pengarsipan
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tighter text-foreground md:text-5xl lg:text-6xl leading-[1.1]">
            Sipadin <br /> <span className="font-medium">Si Paling Dinas.</span>
          </h1>

          <p className="mt-8 text-base leading-relaxed text-muted-foreground md:text-lg max-w-2xl">
            Platform internal untuk generasi berkas SPJ Perjalanan Dinas Bagian Organisasi Kutai Barat.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {isLoggedIn ? (
              <Button
                asChild
                size="lg"
                className="rounded-xl px-10 font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/10 h-12">
                <Link href="/spj">
                  BUKA DAFTAR SPJ <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="rounded-xl px-10 font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/10 h-12">
                <Link href="/login">
                  MASUK KE SISTEM <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-24 grid gap-6 sm:grid-cols-3">
          <QuickLink
            href="/spj"
            icon={<LayoutDashboard className="h-5 w-5" />}
            title="Dashboard SPJ"
            desc="Akses digital untuk memantau status dokumen dan rincian anggaran dinas."
          />
          <QuickLink
            href="/pegawai"
            icon={<Contact2 className="h-5 w-5" />}
            title="Data Pegawai"
            desc="Pemutakhiran data jabatan dan pangkat untuk konsistensi dokumen."
          />
          <QuickLink
            href="/users"
            icon={<Users className="h-5 w-5" />}
            title="Kontrol Akun"
            desc="Pengaturan otoritas pengguna sistem bagi tim pengelola administrasi."
          />
        </section>

        {/* Footer */}
        <footer className="mt-32 border-t border-border/40 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            <div>© 2026 Bagian Organisasi - Sekretariat Daerah</div>
            <div className="flex gap-8">
              <Link href="/spj" className="hover:text-primary transition-colors">
                Workspace
              </Link>
              <Link href="/pegawai" className="hover:text-primary transition-colors">
                Database
              </Link>
              <span className="opacity-30 tracking-normal">V1.0.0</span>
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
      className="group rounded-xl border border-border/40 bg-white p-6 transition-all hover:border-primary/20 hover:shadow-md active:scale-[0.98]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-bold tracking-tight uppercase">{title}</h3>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
    </Link>
  )
}
