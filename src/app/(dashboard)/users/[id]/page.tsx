import Link from 'next/link'
import { notFound } from 'next/navigation'

import ForbiddenCard from '@/components/shared/forbidden'
import { getUserForAdmin } from '@/server/users/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DeleteUserButton from '@/components/users/user-delete-button'
import { ArrowLeft, Calendar, Clock, Edit3, Fingerprint, ShieldCheck, User } from 'lucide-react'

function fmtDateTime(d: Date) {
  try {
    return new Date(d).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getUserForAdmin(id)

  if (result.status === 'FORBIDDEN') return <ForbiddenCard />
  if (result.status === 'NOT_FOUND') notFound()

  const u = result.user

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 animate-in fade-in duration-500 pb-10">
      {/* ACTION HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl border border-border/40">
            <Link href="/users">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detail Pengguna</h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">ID: {u.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-xl h-10 font-bold text-xs border-border/60">
            <Link href={`/users/${u.id}/edit`}>
              <Edit3 className="w-3.5 h-3.5 mr-2" /> EDIT AKUN
            </Link>
          </Button>
          <DeleteUserButton userId={u.id} userName={u.name} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT COLUMN: IDENTITY CARD */}
        <Card className="rounded-xl border-border/40 shadow-none overflow-hidden bg-card/50 md:col-span-1">
          <div className="h-24 bg-primary/5 border-b border-border/40 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-background border-4 border-card flex items-center justify-center shadow-sm">
              <User className="w-8 h-8 text-primary/40" />
            </div>
          </div>
          <CardContent className="p-6 text-center">
            <h2 className="font-bold text-lg leading-tight">{u.name}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">@{u.username}</p>
            <Badge className="mt-4 rounded-lg text-[9px] font-bold px-2 py-0.5 border-none bg-primary text-primary-foreground uppercase tracking-widest">
              {u.role.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: DETAILED INFO */}
        <Card className="rounded-xl border-border/40 shadow-none overflow-hidden md:col-span-2">
          <CardHeader className="bg-muted/10 border-b border-border/40 px-6 py-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Informasi Autentikasi & Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/40">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-4 items-center">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <Fingerprint className="w-3.5 h-3.5" /> Username
              </div>
              <div className="sm:col-span-2 font-mono text-xs text-primary">{u.username}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-4 items-center">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Hak Akses
              </div>
              <div className="sm:col-span-2 text-sm font-semibold">{u.role}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-4 items-center">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" /> Terdaftar Pada
              </div>
              <div className="sm:col-span-2 text-xs font-medium flex items-center gap-2">
                {fmtDateTime(u.createdAt)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-4 items-center">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Perubahan Terakhir
              </div>
              <div className="sm:col-span-2 text-xs font-medium italic text-muted-foreground">
                {fmtDateTime(u.updatedAt)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SAFETY NOTICE (QA Critical) */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start gap-3">
        <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest leading-relaxed">
          Peringatan: Perubahan pada akun ini dapat mempengaruhi akses sistem. Pastikan data sudah benar sebelum
          melakukan editing atau penghapusan permanen.
        </p>
      </div>
    </div>
  )
}
