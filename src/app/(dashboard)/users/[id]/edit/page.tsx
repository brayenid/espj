/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { notFound } from 'next/navigation'

import ForbiddenCard from '@/components/shared/forbidden'
import { getUserForAdmin } from '@/server/users/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import UserForm from '@/components/users/user-form'
import { ArrowLeft, UserCog } from 'lucide-react'

export default async function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getUserForAdmin(id)

  if (result.status === 'FORBIDDEN') return <ForbiddenCard />
  if (result.status === 'NOT_FOUND') notFound()

  const u = result.user

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 animate-in fade-in duration-500 pb-10">
      {/* NAVIGATION & TITLE */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl border border-border/40">
            <Link href={`/users/${u.id}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Akun</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary bg-primary/5">
                {u.username}
              </Badge>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                ID: {u.id.substring(0, 8)}...
              </p>
            </div>
          </div>
        </div>

        <Button asChild variant="secondary" className="rounded-xl h-10 font-bold text-xs">
          <Link href={`/users/${u.id}`}>BATALKAN</Link>
        </Button>
      </div>

      {/* FORM CARD */}
      <Card className="rounded-xl border-border/40 shadow-none overflow-hidden bg-card/50">
        <CardHeader className="bg-muted/10 border-b border-border/40 px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-lg border border-border/40">
              <UserCog className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Konfigurasi Profil & Akses</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-medium">
                Pastikan data sesuai dengan struktur organisasi terbaru
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <UserForm
            mode="edit"
            userId={u.id}
            initial={{
              name: u.name,
              username: u.username,
              role: u.role
            }}
          />
        </CardContent>
      </Card>

      {/* FOOTER INFO */}
      <div className="px-2">
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          * Mengubah password bersifat opsional. Jika kolom password dikosongkan, sistem akan mempertahankan password
          lama yang sudah terenkripsi di database.
        </p>
      </div>
    </div>
  )
}

// Helper Badge local component jika belum di-import global
function Badge({ children, className, variant = 'default' }: any) {
  const variants: any = {
    default: 'bg-primary text-primary-foreground',
    outline: 'border border-border text-foreground'
  }
  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', variants[variant], className)}>{children}</span>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
