import LoginForm from '@/components/auth/login-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileStack } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-4 py-12 font-sans overflow-hidden">
      {/* Background Subtle Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="z-10 w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Brand Identity */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Link href="/" className="group transition-transform hover:scale-95">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground shadow-lg shadow-foreground/10">
              <FileStack className="h-6 w-6 text-background" />
            </div>
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight uppercase">E-SPJ</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Digitalisasi SPJ Perjadin Bagian Organisasi
            </p>
          </div>
        </div>

        <Card className="rounded-2xl border-border/40 shadow-xl shadow-black/[0.02] bg-white overflow-hidden">
          <CardHeader className="space-y-1 pb-6 text-center border-b border-border/40 bg-muted/5">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Otoritas Akses
            </CardTitle>
            <p className="text-[12px] text-muted-foreground leading-relaxed px-4">
              Silakan gunakan kredensial yang telah didaftarkan oleh administrator sistem.
            </p>
          </CardHeader>
          <CardContent className="pt-8">
            <LoginForm />
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center space-y-4">
          <div className="pt-4 border-t border-border/40">
            <Link
              href="/"
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
              ← Kembali ke Halaman Utama
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
