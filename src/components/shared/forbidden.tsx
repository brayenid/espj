import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ForbiddenCard() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Akses ditolak</CardTitle>
          <p className="text-sm text-muted-foreground">Kamu tidak punya akses untuk melihat SPJ ini.</p>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button asChild variant="secondary" className="rounded-2xl">
            <Link href="/spj">Kembali ke daftar SPJ</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
