import { NextResponse } from 'next/server'
import { searchPegawai } from '@/server/pegawai/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') ?? ''
  const items = await searchPegawai(q)
  return NextResponse.json({ items })
}
