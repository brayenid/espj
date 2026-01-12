/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createUser } from '@/server/users/mutations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const result = await createUser(body)

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message, issues: (result as any).issues }, { status: 400 })
  }

  return NextResponse.json({ ok: true, id: result.id })
}
