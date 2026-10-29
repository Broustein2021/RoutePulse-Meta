import { sql } from '@/lib/db'
import {
  erreurJson,
  estUuid,
  lireCorpsJson,
  reponseJson,
  validerDeviceId,
} from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    // Next 16 : params est une Promise.
    const { id } = await params

    if (!estUuid(id)) {
      return erreurJson('Identifiant de signalement invalide.', 400)
    }

    const corps = await lireCorpsJson(request)
    if (!corps.ok) return erreurJson(corps.erreur, 400)

    const deviceId = validerDeviceId(
      corps.valeur && typeof corps.valeur === 'object'
        ? corps.valeur.device_id
        : undefined,
      { obligatoire: true }
    )
    if (!deviceId.ok) return erreurJson(deviceId.erreur, 400)

    const existe = await sql`
      SELECT 1 FROM signalements WHERE id = ${id}::uuid
    `
    if (existe.length === 0) {
      return erreurJson('Signalement introuvable.', 404)
    }

    // Une seule requête atomique :
    // 1. insère la confirmation (une par appareil, ON CONFLICT DO NOTHING) ;
    // 2. recompte les confirmations (existantes + celle éventuellement ajoutée) ;
    // 3. met à jour score_gravite, statut et nb_confirmations.
    const [resultat] = await sql`
      WITH confirmation_ajoutee AS (
        INSERT INTO confirmations (signalement_id, device_id)
        VALUES (${id}::uuid, ${deviceId.valeur})
        ON CONFLICT DO NOTHING
        RETURNING signalement_id
      ),
      compteur AS (
        SELECT
          (
            SELECT count(*)::int
            FROM confirmations
            WHERE signalement_id = ${id}::uuid
          ) AS existantes,
          (SELECT count(*)::int FROM confirmation_ajoutee) AS ajoutees
      ),
      mise_a_jour AS (
        UPDATE signalements s
        SET
          score_gravite = LEAST(1 + compteur.existantes + compteur.ajoutees, 3),
          statut = CASE
            WHEN LEAST(1 + compteur.existantes + compteur.ajoutees, 3) >= 2
              THEN 'confirme'
            ELSE 'isole'
          END,
          nb_confirmations = compteur.existantes + compteur.ajoutees
        FROM compteur
        WHERE s.id = ${id}::uuid
        RETURNING
          s.id,
          s.type,
          s.latitude,
          s.longitude,
          s.description,
          s.photo_url,
          s.statut,
          s.score_gravite,
          s.created_at,
          s.nb_confirmations
      )
      SELECT
        mise_a_jour.*,
        (SELECT count(*)::int FROM confirmation_ajoutee) = 0 AS deja_confirme
      FROM mise_a_jour
    `

    if (!resultat) {
      return erreurJson('Signalement introuvable.', 404)
    }

    const { deja_confirme, ...signalement } = resultat

    return reponseJson({ signalement, deja_confirme })
  } catch (err) {
    // Violation de clé étrangère : le signalement a disparu entre-temps.
    if (err && err.code === '23503') {
      return erreurJson('Signalement introuvable.', 404)
    }
    console.error('POST /api/signalements/[id]/confirm:', err)
    return erreurJson('Erreur serveur', 500)
  }
}
