import Link from 'next/link'
import { notFound } from 'next/navigation'

import ForbiddenCard from '@/components/shared/forbidden'
import { listUsersForAdmin } from '@/server/users/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, UserPlus, Settings2, ChevronLeft, ChevronRight, Users, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

function fmtDate(d: Date) {
  try {
    return new Date(d).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

export default async function UsersListPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const q = (sp.q ?? '').toString()
  const page = Math.max(1, Number(sp.page ?? '1') || 1)

  const result = await listUsersForAdmin({ q, page, pageSize: 20 })

  if (result.status === 'FORBIDDEN') return <ForbiddenCard />
  if (result.status !== 'OK') notFound()

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))

  const mkHref = (p: number) => {
    const qs = new URLSearchParams()
    if (q.trim()) qs.set('q', q.trim())
    qs.set('page', String(p))
    return `/users?${qs.toString()}`
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Akun</h1>
            <p className="text-sm text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
              Administrator Access Only
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-xl h-10 font-bold text-xs border-border/60">
            <Link href="/users/new">
              <UserPlus className="w-4 h-4 mr-2" /> TAMBAH AKUN
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-xl border-border/40 shadow-none overflow-hidden bg-card/50">
        <CardHeader className="bg-muted/10 border-b border-border/40 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
              Daftar Pengguna Sistem
            </CardTitle>

            {/* SEARCH FORM */}
            <form action="/users" method="GET" className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Cari nama/username..."
                  className="h-9 w-full sm:w-[240px] rounded-lg border-border/40 pl-9 text-xs bg-background focus-visible:ring-primary/20"
                />
              </div>
              <Button type="submit" size="sm" className="h-9 rounded-lg font-bold text-[10px] px-4">
                CARI
              </Button>
              {q.trim() && (
                <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                  <Link href="/users">
                    <RotateCcw className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </form>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12 px-6">
                    Nama Pengguna
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12">Username</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12">
                    Otoritas (Role)
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12 hidden md:table-cell">
                    Tgl Terdaftar
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12 w-[100px] text-right px-6"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {result.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="w-10 h-10 mb-2 opacity-10" />
                        <p className="text-sm font-medium">Tidak ada data pengguna ditemukan.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  result.items.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/10 border-border/40 transition-colors group">
                      <TableCell className="px-6 py-4">
                        <div className="font-bold text-sm">{u.name}</div>
                      </TableCell>
                      <TableCell>
                        <code className="text-[11px] bg-muted px-2 py-0.5 rounded font-mono text-primary uppercase">
                          {u.username}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-lg text-[9px] font-bold px-2 py-0 border-none bg-primary/10 text-primary uppercase tracking-tighter">
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-medium">
                        {fmtDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="rounded-lg h-8 w-8 p-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <Link href={`/users/${u.id}`}>
                            <Settings2 className="w-4 h-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* FOOTER / PAGINATION */}
          <div className="border-t border-border/40 px-6 py-4 bg-muted/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Halaman {result.page} dari {totalPages} <span className="mx-2 opacity-30">|</span> Total {result.total}{' '}
              User
            </div>

            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  'rounded-lg h-8 font-bold text-[10px] border-border/60 shadow-sm',
                  result.page <= 1 && 'pointer-events-none opacity-50'
                )}>
                <Link href={mkHref(Math.max(1, result.page - 1))}>
                  <ChevronLeft className="w-3 h-3 mr-1" /> PREV
                </Link>
              </Button>

              <div className="flex items-center gap-1">
                {/* Visual indicator page numbers could go here if needed */}
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  'rounded-lg h-8 font-bold text-[10px] border-border/60 shadow-sm',
                  result.page >= totalPages && 'pointer-events-none opacity-50'
                )}>
                <Link href={mkHref(Math.min(totalPages, result.page + 1))}>
                  NEXT <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
