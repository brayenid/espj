import { NextResponse } from 'next/server'
import { createSpjDraft } from '@/server/spj/mutations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const result = await createSpjDraft(body)

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message, issues: result.issues }, { status: 400 })
  }

  return NextResponse.json({ ok: true, id: result.id })
}
