import Link from 'next/link'
import ForbiddenCard from '@/components/shared/forbidden'
import { requireSuperAdmin } from '@/server/users/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import UserForm from '@/components/users/user-form'

export default async function UserNewPage() {
  const gate = await requireSuperAdmin()
  if (!gate.ok) return <ForbiddenCard />

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 md:px-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tambah Akun</h1>
          <p className="text-sm text-muted-foreground">Buat user baru sesuai model Prisma.</p>
        </div>
        <Button asChild variant="secondary" className="rounded-2xl">
          <Link href="/users">Kembali</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Form User</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm mode="create" />
        </CardContent>
      </Card>
    </div>
  )
}
