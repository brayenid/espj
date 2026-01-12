import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { UserRole } from '@prisma/client'

type Forbidden = { status: 'FORBIDDEN' }
type NotFound = { status: 'NOT_FOUND' }

export type UserListItem = {
  id: string
  name: string
  username: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export async function requireSuperAdmin() {
  const session = await auth()
  const role = session?.user?.role as UserRole | undefined
  if (!session?.user?.id) return { ok: false as const, status: 'FORBIDDEN' as const }
  if (role !== UserRole.SUPER_ADMIN) return { ok: false as const, status: 'FORBIDDEN' as const }
  return { ok: true as const, session }
}

export async function listUsersForAdmin(params: { q?: string; page?: number; pageSize?: number }) {
  const gate = await requireSuperAdmin()
  if (!gate.ok) return { status: 'FORBIDDEN' as const, items: [] as UserListItem[], total: 0, page: 1, pageSize: 20 }

  const q = (params.q ?? '').trim()
  const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 20))
  const page = Math.max(1, params.page ?? 1)
  const skip = (page - 1) * pageSize

  const where =
    q.length > 0
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { username: { contains: q, mode: 'insensitive' as const } }
          ]
        }
      : {}

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: pageSize,
      select: { id: true, name: true, username: true, role: true, createdAt: true, updatedAt: true }
    })
  ])

  return { status: 'OK' as const, items, total, page, pageSize, q }
}

export async function getUserForAdmin(id: string) {
  const gate = await requireSuperAdmin()
  if (!gate.ok) return { status: 'FORBIDDEN' as const } as Forbidden

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, username: true, role: true, createdAt: true, updatedAt: true }
  })
  if (!user) return { status: 'NOT_FOUND' as const } as NotFound
  return { status: 'OK' as const, user }
}
