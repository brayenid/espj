'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

export default function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(json?.message ?? 'Gagal menghapus user.')
        return
      }

      toast.success('User dihapus.')
      router.push('/users')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="rounded-2xl">
          Hapus
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus akun?</AlertDialogTitle>
          <AlertDialogDescription>
            Kamu akan menghapus akun <span className="font-medium">{userName}</span>. Tindakan ini tidak bisa
            dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-2xl">Batal</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-2xl"
            onClick={(e) => {
              e.preventDefault()
              onDelete()
            }}
            disabled={loading}>
            {loading ? 'Menghapus…' : 'Ya, hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
