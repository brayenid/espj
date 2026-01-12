import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const UpsertSchema = z.object({
  stageCount: z.number().int().min(1).max(12)
})

async function ensureOwner(spjId: string, userId: string, role: string) {
  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: { id: true, createdById: true }
  })
  if (!spj) return { ok: false, status: 404 as const }
  if (role !== 'SUPER_ADMIN' && spj.createdById !== userId) return { ok: false, status: 403 as const }
  return { ok: true, status: 200 as const }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: spjId } = await ctx.params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const guard = await ensureOwner(spjId, session.user.id, session.user.role as string)
  if (!guard.ok) return NextResponse.json({ message: 'Forbidden' }, { status: guard.status })

  const visum = await prisma.spjVisum.findUnique({
    where: { spjId },
    select: { id: true, spjId: true, stageCount: true }
  })

  return NextResponse.json(
    {
      visum: visum ?? { spjId, stageCount: 4 }
    },
    { status: 200 }
  )
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: spjId } = await ctx.params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const guard = await ensureOwner(spjId, session.user.id, session.user.role as string)
  if (!guard.ok) return NextResponse.json({ message: 'Forbidden' }, { status: guard.status })

  const body = await req.json()
  const parsed = UpsertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })

  const { stageCount } = parsed.data

  const saved = await prisma.spjVisum.upsert({
    where: { spjId },
    create: { spjId, stageCount },
    update: { stageCount },
    select: { id: true, spjId: true, stageCount: true }
  })

  return NextResponse.json({ visum: saved }, { status: 200 })
}
