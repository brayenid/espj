// src/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw)
        if (!parsed.success) return null

        const { username, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { username }
        })

        if (!user) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        // object user yang dikembalikan akan masuk ke callback jwt/session
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id
        token.name = user.name
        // @ts-expect-error add custom fields
        token.username = user.username
        // @ts-expect-error add custom fields
        token.role = user.role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        // token.sub berisi userId
        session.user.id = token.sub ?? ''
        // @ts-expect-error add custom fields
        session.user.username = token.username
        // @ts-expect-error add custom fields
        session.user.role = token.role
      }
      return session
    }
  }
})

export const { GET, POST } = handlers
