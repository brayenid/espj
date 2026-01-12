import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import LaporanForm from '@/components/spj/laporan-form'

async function ensureOwnerOrAdmin(spjId: string, userId: string, role: string) {
  if (!spjId) return { ok: false, status: 400 as const }
  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: { id: true, createdById: true }
  })
  if (!spj) return { ok: false, status: 404 as const }
  if (role !== 'SUPER_ADMIN' && spj.createdById !== userId) return { ok: false, status: 403 as const }
  return { ok: true, status: 200 as const }
}

export default async function LaporanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: spjId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const guard = await ensureOwnerOrAdmin(spjId, session.user.id, session.user.role as string)
  if (!guard.ok) redirect('/dashboard')

  const spj = await prisma.spj.findUnique({
    where: { id: spjId },
    select: {
      id: true,
      noSuratTugas: true,
      tglSuratTugas: true,
      kotaTandaTangan: true,
      maksudDinas: true,
      tempatBerangkat: true,
      tempatTujuan: true,
      laporan: true,
      roster: {
        orderBy: [{ role: 'asc' }, { order: 'asc' }],
        select: {
          id: true,
          order: true,
          role: true,
          nama: true,
          nip: true,
          jabatan: true,
          pangkat: true,
          golongan: true,
          instansi: true
        }
      }
    }
  })

  if (!spj) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <LaporanForm
        spjId={spj.id}
        spj={{
          noSuratTugas: spj.noSuratTugas,
          tglSuratTugas: spj.tglSuratTugas,
          kotaTandaTangan: spj.kotaTandaTangan,
          maksudDinas: spj.maksudDinas,
          tempatBerangkat: spj.tempatBerangkat,
          tempatTujuan: spj.tempatTujuan
        }}
        roster={spj.roster}
        initial={spj.laporan}
      />
    </div>
  )
}
