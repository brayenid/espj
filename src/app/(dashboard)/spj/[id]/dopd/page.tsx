// src/app/(dashboard)/spj/[id]/dopd/page.tsx
import DopdForm from '@/components/spj/dopd-form'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'

export default async function DopdPage(ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return notFound()

  const { id: spjId } = await ctx.params

  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: {
      id: true,
      createdById: true,
      roster: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          order: true,
          role: true,
          nama: true,
          nip: true,
          jabatan: true,
          pangkat: true,
          golongan: true
        }
      },
      rincian: {
        select: {
          id: true,
          rosterItemId: true,
          kategori: true,
          uraian: true,
          hargaSatuan: true,
          total: true,
          factors: {
            orderBy: { order: 'asc' },
            select: { id: true, order: true, label: true, qty: true }
          }
        }
      },
      signers: {
        where: { docType: 'DOPD' },
        orderBy: { order: 'asc' },
        select: {
          order: true,
          pegawaiId: true,
          nama: true,
          nip: true
        }
      }
    }
  })

  if (!spj) return notFound()

  const isOwner = spj.createdById === session.user.id
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  if (!isOwner && !isSuperAdmin) return notFound()

  return <DopdForm spjId={spjId} roster={spj.roster} initialItems={spj.rincian} initialSigners={spj.signers} />
}
