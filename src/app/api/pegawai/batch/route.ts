import { NextResponse } from 'next/server'
import { syncPegawaiBatch } from '@/server/pegawai/mutations'

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null)

  if (!body) return NextResponse.json({ ok: false, message: 'No payload' }, { status: 400 })

  const result = await syncPegawaiBatch(body)

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
