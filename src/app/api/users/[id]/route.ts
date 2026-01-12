/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { updateUser, deleteUser } from '@/server/users/mutations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await _req.json().catch(() => null)
  const result = await updateUser(id, body)

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message, issues: (result as any).issues }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const result = await deleteUser(id)

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
