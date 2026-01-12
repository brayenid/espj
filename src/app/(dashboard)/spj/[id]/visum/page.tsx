import { prisma } from '@/lib/prisma'
import VisumForm from '@/components/spj/visum-form'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'

async function ensureOwnerOrAdmin(spjId: string, userId: string, role: string) {
  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: { id: true, createdById: true }
  })

  if (!spj) return { ok: false as const, reason: 'NOT_FOUND' as const }
  if (role !== 'SUPER_ADMIN' && spj.createdById !== userId) return { ok: false as const, reason: 'FORBIDDEN' as const }

  return { ok: true as const }
}

export default async function VisumPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id: spjId } = await params
  if (!spjId) notFound()

  const guard = await ensureOwnerOrAdmin(spjId, session.user.id, session.user.role as string)
  if (!guard.ok) {
    if (guard.reason === 'NOT_FOUND') notFound()
    redirect('/dashboard')
  }

  const visum = await prisma.spjVisum.findUnique({
    where: { spjId },
    select: { stageCount: true }
  })

  return <VisumForm spjId={spjId} initialStageCount={visum?.stageCount ?? 4} />
}
