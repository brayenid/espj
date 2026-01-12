'use client'

import { signOut } from 'next-auth/react'

export default function UserActions() {
  return (
    <button type="button" className="rounded-2xl w-full" onClick={() => signOut({ callbackUrl: '/login' })}>
      Keluar
    </button>
  )
}
