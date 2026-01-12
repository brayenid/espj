/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const roles = ['SUPER_ADMIN', 'TIM_ORGANISASI', 'TIM_KEUANGAN', 'TIM_UMUM'] as const
type Role = (typeof roles)[number]

const createSchema = z.object({
  name: z.string().trim().min(2),
  username: z.string().trim().min(3),
  role: z.enum(roles).optional(),
  password: z.string().min(6)
})

const editSchema = z.object({
  name: z.string().trim().min(2),
  username: z.string().trim().min(3),
  role: z.enum(roles),
  password: z.string().optional() // kosong = tidak diubah
})

type CreateState = z.infer<typeof createSchema>
type EditState = z.infer<typeof editSchema>

export default function UserForm({
  mode,
  userId,
  initial
}: {
  mode: 'create' | 'edit'
  userId?: string
  initial?: { name: string; username: string; role: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const defaultCreate = useMemo<CreateState>(() => {
    return {
      name: '',
      username: '',
      role: 'TIM_ORGANISASI',
      password: ''
    }
  }, [])

  const defaultEdit = useMemo<EditState>(() => {
    return {
      name: initial?.name ?? '',
      username: initial?.username ?? '',
      role: (initial?.role as Role) ?? 'TIM_ORGANISASI',
      password: ''
    }
  }, [initial])

  const [values, setValues] = useState<CreateState | EditState>(mode === 'create' ? defaultCreate : defaultEdit)

  const set = (key: keyof (CreateState & EditState)) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = (mode === 'create' ? createSchema : editSchema).safeParse(values)
    if (!parsed.success) {
      toast.error('Cek kembali input.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'create') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data)
        })
        const json = (await res.json().catch(() => null)) as any

        if (!res.ok) {
          toast.error(json?.message ?? 'Gagal membuat user.')
          return
        }

        toast.success('User berhasil dibuat.')
        router.push(`/users/${json.id}`)
        router.refresh()
      } else {
        if (!userId) {
          toast.error('User ID tidak ada.')
          return
        }

        const payload = {
          ...parsed.data,
          password: (parsed.data as any).password?.trim() ? (parsed.data as any).password : null
        }

        const res = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const json = (await res.json().catch(() => null)) as any

        if (!res.ok) {
          toast.error(json?.message ?? 'Gagal menyimpan perubahan.')
          return
        }

        toast.success('User tersimpan.')
        router.push(`/users/${userId}`)
        router.refresh()
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nama</Label>
          <Input
            className="rounded-2xl"
            value={(values as any).name}
            onChange={set('name')}
            placeholder="Contoh: Brayen Luhat"
          />
        </div>

        <div className="space-y-2">
          <Label>Username</Label>
          <Input
            className="rounded-2xl"
            value={(values as any).username}
            onChange={set('username')}
            placeholder="Contoh: brayen / bfenomenal"
          />
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={(values as any).role}
            onValueChange={(v) => setValues((prev) => ({ ...prev, role: v as any }))}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Pilih role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-xl" variant="secondary">
                      {r}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{mode === 'create' ? 'Password' : 'Password baru (opsional)'}</Label>
          <Input
            className="rounded-2xl"
            type="password"
            value={(values as any).password ?? ''}
            onChange={set('password')}
            placeholder={mode === 'create' ? 'Minimal 6 karakter' : 'Kosongkan jika tidak diubah'}
          />
        </div>
      </div>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button type="submit" className="rounded-2xl" disabled={loading}>
          {loading ? 'Menyimpan…' : mode === 'create' ? 'Buat Akun' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  )
}
