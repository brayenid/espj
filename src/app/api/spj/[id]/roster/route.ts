import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addRosterItem, removeRosterItem, setKepalaJalan } from '@/server/spj/roster'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const postSchema = z.object({ pegawaiId: z.string().min(1) })
const patchSchema = z.object({ kepalaRosterItemId: z.string().min(1) })
const deleteSchema = z.object({ rosterItemId: z.string().min(1) })

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const result = await addRosterItem(id, parsed.data.pegawaiId)
  if (result.status !== 'OK') return NextResponse.json({ ok: false, status: result.status }, { status: 403 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const result = await setKepalaJalan(id, parsed.data.kepalaRosterItemId)
  if (result.status !== 'OK') return NextResponse.json({ ok: false, status: result.status }, { status: 403 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const result = await removeRosterItem(id, parsed.data.rosterItemId)
  if (result.status !== 'OK') return NextResponse.json({ ok: false, status: result.status }, { status: 403 })

  return NextResponse.json({ ok: true })
}
