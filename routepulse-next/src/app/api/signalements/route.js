import { sql } from '@/lib/db'
import {
  erreurJson,
  lireCorpsJson,
  lireLimite,
  reponseJson,
  validerFiltres,
  validerNouveauSignalement,
} from '@/lib/api'

// Les route handlers GET ne sont pas mis en cache par défaut en Next 16 ;
// on force le rendu dynamique et on ajoute Cache-Control: no-store.
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const filtres = validerFiltres(
      searchParams.get('type'),
      searchParams.get('statut')
    )
    if (!filtres.ok) return erreurJson(filtres.erreur, 400)

    const limite = lireLimite(searchParams.get('limit'))
    const { type, statut } = filtres.valeur

    // Filtres passés en paramètres : aucune concaténation SQL.
    const lignes = await sql`
      SELECT
        s.id,
        s.type,
        s.latitude,
        s.longitude,
        s.description,
        s.photo_url,
        s.statut,
        s.score_gravite,
        s.created_at,
        count(c.signalement_id)::int AS nb_confirmations
      FROM signalements s
      LEFT JOIN confirmations c ON c.signalement_id = s.id
      WHERE (${type}::text IS NULL OR s.type = ${type}::text)
        AND (${statut}::text IS NULL OR s.statut = ${statut}::text)
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ${limite}::int
    `

    return reponseJson(lignes)
  } catch (err) {
    console.error('GET /api/signalements:', err)
    return erreurJson('Erreur serveur', 500)
  }
}

export async function POST(request) {
  try {
    const corps = await lireCorpsJson(request)
    if (!corps.ok) return erreurJson(corps.erreur, 400)

    const validation = validerNouveauSignalement(corps.valeur)
    if (!validation.ok) return erreurJson(validation.erreur, 400)

    const { type, latitude, longitude, description, photo_url, device_id } =
      validation.valeur

    // statut et score_gravite sont forcés côté serveur, toute valeur cliente
    // est ignorée. device_id est validé puis enregistré (null s'il est absent).
    const [ligne] = await sql`
      INSERT INTO signalements (
        type,
        latitude,
        longitude,
        description,
        photo_url,
        device_id,
        statut,
        score_gravite
      )
      VALUES (
        ${type},
        ${latitude},
        ${longitude},
        ${description},
        ${photo_url},
        ${device_id},
        'isole',
        1
      )
      RETURNING
        id,
        type,
        latitude,
        longitude,
        description,
        photo_url,
        statut,
        score_gravite,
        created_at,
        nb_confirmations
    `

    return reponseJson(ligne, 201)
  } catch (err) {
    console.error('POST /api/signalements:', err)
    return erreurJson('Erreur serveur', 500)
  }
}
