'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, LockKeyhole, User } from 'lucide-react'

const schema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi')
})

export default function LoginForm() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState('/spj')

  // Mengambil callbackUrl tanpa hook useSearchParams untuk menghindari kebutuhan akan <Suspense>
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const url = params.get('callbackUrl')
      if (url) setCallbackUrl(url)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const parsed = schema.safeParse({ username, password })
    if (!parsed.success) {
      toast.error('Kredensial wajib diisi lengkap.')
      setLoading(false)
      return
    }

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false
      })

      if (!res || res.error) {
        toast.error('Autentikasi gagal. Periksa kembali username/password.')
        setLoading(false)
        return
      }

      toast.success('Akses diberikan. Mengarahkan...')

      // Mengarahkan pengguna
      router.push(callbackUrl)
      router.refresh()
    } catch {
      toast.error('Gagal terhubung ke server autentikasi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1">
            Identitas Pengguna
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Username"
              className="h-11 rounded-xl bg-muted/20 border-border/40 pl-10 text-sm focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1">
            Kata Sandi
          </label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 rounded-xl bg-muted/20 border-border/40 pl-10 text-sm focus-visible:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/10 transition-all active:scale-[0.98]">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> VERIFIKASI...
          </>
        ) : (
          'MASUK KE SISTEM'
        )}
      </Button>
    </form>
  )
}
