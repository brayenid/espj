/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { requireSuperAdmin } from './queries'
import { hashPassword } from './password'

const roleEnum = z.nativeEnum(UserRole)

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  username: z.string().trim().min(3, 'Username minimal 3 karakter'),
  role: roleEnum.optional(),
  password: z.string().min(6, 'Password minimal 6 karakter')
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  username: z.string().trim().min(3, 'Username minimal 3 karakter'),
  role: roleEnum,
  password: z.string().optional().nullable() // kosong => tidak diubah
})

export async function createUser(input: unknown) {
  const gate = await requireSuperAdmin()
  if (!gate.ok) return { ok: false as const, message: 'Forbidden' }

  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, message: 'Validasi gagal', issues: parsed.error.issues }

  const data = parsed.data
  const passwordHash = await hashPassword(data.password)

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        role: data.role ?? UserRole.TIM_ORGANISASI,
        passwordHash
      },
      select: { id: true }
    })
    return { ok: true as const, id: user.id }
  } catch (e: any) {
    // unique constraint username
    if (e?.code === 'P2002') {
      return { ok: false as const, message: 'Username sudah dipakai.' }
    }
    return { ok: false as const, message: 'Gagal membuat user.' }
  }
}

export async function updateUser(id: string, input: unknown) {
  const gate = await requireSuperAdmin()
  if (!gate.ok) return { ok: false as const, message: 'Forbidden' }

  const parsed = updateUserSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, message: 'Validasi gagal', issues: parsed.error.issues }

  const data = parsed.data

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return { ok: false as const, message: 'User tidak ditemukan.' }

  const patch: any = {
    name: data.name,
    username: data.username,
    role: data.role
  }

  const pw = (data.password ?? '').trim()
  if (pw.length > 0) {
    patch.passwordHash = await hashPassword(pw)
  }

  try {
    await prisma.user.update({ where: { id }, data: patch })
    return { ok: true as const }
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return { ok: false as const, message: 'Username sudah dipakai.' }
    }
    return { ok: false as const, message: 'Gagal menyimpan perubahan.' }
  }
}

export async function deleteUser(id: string) {
  const gate = await requireSuperAdmin()
  if (!gate.ok) return { ok: false as const, message: 'Forbidden' }

  const sessionUserId = gate.session.user.id

  if (id === sessionUserId) {
    return { ok: false as const, message: 'Tidak bisa menghapus akun sendiri.' }
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return { ok: false as const, message: 'User tidak ditemukan.' }

  await prisma.user.delete({ where: { id } })
  return { ok: true as const }
}
