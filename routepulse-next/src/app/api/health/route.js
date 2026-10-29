import { sql } from '@/lib/db'

export async function GET() {
  try {
    const [{ now }] = await sql`SELECT now() AS now`
    const [{ total }] = await sql`SELECT count(*)::int AS total FROM signalements`
    return Response.json({ ok: true, now, total })
  } catch (err) {
    console.error('health:', err)
    return Response.json({ ok: false, error: 'db' }, { status: 500 })
  }
}