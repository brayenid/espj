import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, FileStack, Users, Contact2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import UserActions from '@/components/layout/user-actions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // QA Check: Proteksi route tingkat layout
  if (!session) {
    redirect('/login')
  }

  const userRole = session.user?.role

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      {/* --- NAVIGATION BAR --- */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Brand & Main Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center transition-transform group-hover:scale-95 shadow-sm">
                <FileStack className="w-4 h-4 text-background" />
              </div>
              <span className="font-bold tracking-tighter text-lg">E-SPJ</span>
            </Link>

            <Separator orientation="vertical" className="h-6 bg-border/40 hidden md:block" />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <NavButton href="/spj" icon={<LayoutDashboard className="w-4 h-4" />}>
                SPJ
              </NavButton>
              <NavButton href="/pegawai" icon={<Contact2 className="w-4 h-4" />}>
                Pegawai
              </NavButton>
              {userRole === 'SUPER_ADMIN' && (
                <NavButton href="/users" icon={<Users className="w-4 h-4" />}>
                  Pengguna
                </NavButton>
              )}
            </div>
          </div>

          {/* Right: User Profile Section */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full border border-border/40 p-0 hover:bg-muted transition-all overflow-hidden shadow-sm">
                  <Avatar className="h-full w-full">
                    <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                      {session.user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60 rounded-xl shadow-xl border-border/40 p-1.5" align="end" forceMount>
                <DropdownMenuLabel className="font-normal px-2 py-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{session.user?.name}</p>
                    <p className="text-[10px] leading-none text-muted-foreground uppercase tracking-wider mt-1.5">
                      {session.user?.username} • {userRole?.replace('_', ' ')}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="rounded-lg cursor-pointer py-2 px-3 focus:bg-primary/5 focus:text-primary">
                  <Link href="/spj" className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 opacity-70" />
                    <span className="text-xs font-semibold uppercase tracking-widest">Daftar SPJ</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <UserActions />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <div className="animate-in fade-in duration-700">{children}</div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full border-t border-border/40 py-8 bg-white/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
          <div className="w-6 h-6 bg-muted rounded flex items-center justify-center mb-2">
            <FileStack className="w-3 h-3 text-muted-foreground" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            © 2026 Bagian Organisasi - Sekretariat Daerah
          </p>
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">Kabupaten Kutai Barat</p>
        </div>
      </footer>
    </div>
  )
}

/**
 * NavButton Sub-component
 * Menjaga tampilan tombol navigasi tetap konsisten dan bersih.
 */
function NavButton({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Button
      asChild
      variant="ghost"
      className="rounded-lg h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-xs gap-2">
      <Link href={href}>
        {icon}
        <span className="uppercase tracking-widest text-[10px] font-bold">{children}</span>
      </Link>
    </Button>
  )
}

function Separator({
  orientation = 'horizontal',
  className
}: {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}) {
  return (
    <div
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
    />
  )
}
