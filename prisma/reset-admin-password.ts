import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const prisma = new PrismaClient()
  const passwordHash = await bcrypt.hash('admin123', 12)
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash },
    create: {
      name: 'Super Admin',
      username: 'admin',
      role: 'SUPER_ADMIN',
      passwordHash
    }
  })
  
  console.log('Password for user "admin" in V1 has been reset to "admin123"')
  await prisma.$disconnect()
}

main().catch(console.error)
