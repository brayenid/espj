import { prisma } from '@/lib/prisma'
import { auth } from '@/auth' // Sesuaikan dengan setup auth Anda
import { NextResponse } from 'next/server'

/**
 * DELETE: Menghapus SPJ berdasarkan ID
 * Endpoint: /api/spj/[id]
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()

    // 1. Validasi Sesi
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    // 2. Cek Kepemilikan (Safety First)
    const spj = await prisma.spj.findUnique({
      where: { id },
      select: { createdById: true }
    })

    if (!spj) {
      return NextResponse.json({ ok: false, message: 'Data tidak ditemukan' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'SUPER_ADMIN'
    const isOwner = spj.createdById === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { ok: false, message: 'Anda tidak memiliki akses untuk menghapus data ini' },
        { status: 403 }
      )
    }

    // 3. Eksekusi Hapus
    // Cascade delete pada schema Prisma akan menghapus roster, signers, dll. secara otomatis
    await prisma.spj.delete({
      where: { id }
    })

    return NextResponse.json({ ok: true, message: 'Data berhasil dihapus' })
  } catch (error) {
    console.error('API_SPJ_DELETE_ERROR:', error)
    return NextResponse.json({ ok: false, message: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
