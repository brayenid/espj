import { NextResponse } from 'next/server'
import { getTelaahanForCurrentUser, upsertTelaahanForCurrentUser } from '@/server/spj/telaahan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const result = await getTelaahanForCurrentUser(id)

  if (result.status !== 'OK') {
    return NextResponse.json({ ok: false, status: result.status }, { status: 403 })
  }

  return NextResponse.json({ ok: true, telaahan: result.telaahan, roster: result.roster })
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)

  const result = await upsertTelaahanForCurrentUser(id, body)

  if (result.status === 'VALIDATION_ERROR') {
    return NextResponse.json({ ok: false, status: result.status, issues: result.issues }, { status: 400 })
  }
  if (result.status !== 'OK') {
    return NextResponse.json({ ok: false, status: result.status }, { status: 403 })
  }

  return NextResponse.json({ ok: true, id: result.id })
}
