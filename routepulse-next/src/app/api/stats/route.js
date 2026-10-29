import { sql } from '@/lib/db'
import { erreurJson, reponseJson } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Agrégats calculés en base : aucune ligne brute n'est chargée.
    const [totauxRows, parType] = await Promise.all([
      sql`
        SELECT
          count(*)::int AS total,
          count(*) FILTER (WHERE statut = 'confirme')::int AS confirmes,
          count(*) FILTER (
            WHERE created_at >= now() - interval '24 hours'
          )::int AS dernieres_24h
        FROM signalements
      `,
      sql`
        SELECT type, count(*)::int AS nombre
        FROM signalements
        GROUP BY type
        ORDER BY nombre DESC, type ASC
      `,
    ])

    const totaux = totauxRows[0] ?? {
      total: 0,
      confirmes: 0,
      dernieres_24h: 0,
    }

    return reponseJson({
      total: totaux.total,
      confirmes: totaux.confirmes,
      dernieres_24h: totaux.dernieres_24h,
      par_type: parType,
    })
  } catch (err) {
    console.error('GET /api/stats:', err)
    return erreurJson('Erreur serveur', 500)
  }
}
