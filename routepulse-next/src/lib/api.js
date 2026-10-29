// Utilitaires partagés de la couche API (validation + réponses JSON).

export const TYPES_SIGNALEMENT = [
  'nid-de-poule',
  'accident',
  'embouteillage',
  'inondation',
  'obstacle',
  'autre',
]

export const STATUTS_SIGNALEMENT = ['isole', 'confirme']

export const DESCRIPTION_MAX = 200
export const DEVICE_ID_MIN = 8
export const DEVICE_ID_MAX = 64
export const LIMITE_DEFAUT = 200
export const LIMITE_MAX = 500

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Toutes les réponses de l'API sont non mises en cache.
export function reponseJson(corps, statut = 200) {
  return Response.json(corps, {
    status: statut,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

export function erreurJson(message, statut = 400) {
  return reponseJson({ error: message }, statut)
}

export async function lireCorpsJson(request) {
  try {
    const corps = await request.json()
    return { ok: true, valeur: corps }
  } catch {
    return { ok: false, erreur: 'Corps JSON invalide.' }
  }
}

export function estUuid(valeur) {
  return typeof valeur === 'string' && UUID_REGEX.test(valeur)
}

// device_id : absent/null autorisé si non obligatoire, sinon 8 à 64 caractères.
export function validerDeviceId(valeur, { obligatoire = false } = {}) {
  if (valeur === undefined || valeur === null || valeur === '') {
    if (obligatoire) {
      return {
        ok: false,
        erreur: `device_id est obligatoire (${DEVICE_ID_MIN} à ${DEVICE_ID_MAX} caractères).`,
      }
    }
    return { ok: true, valeur: null }
  }

  if (typeof valeur !== 'string') {
    return { ok: false, erreur: 'device_id doit être une chaîne de caractères.' }
  }

  const identifiant = valeur.trim()
  if (identifiant.length < DEVICE_ID_MIN || identifiant.length > DEVICE_ID_MAX) {
    return {
      ok: false,
      erreur: `device_id doit contenir entre ${DEVICE_ID_MIN} et ${DEVICE_ID_MAX} caractères.`,
    }
  }

  return { ok: true, valeur: identifiant }
}

function validerCoordonnee(valeur, minimum, maximum, nom) {
  if (
    typeof valeur !== 'number' &&
    !(typeof valeur === 'string' && valeur.trim() !== '')
  ) {
    return { ok: false, erreur: `${nom} doit être un nombre.` }
  }

  const nombre = Number(valeur)
  if (!Number.isFinite(nombre)) {
    return { ok: false, erreur: `${nom} doit être un nombre.` }
  }
  if (nombre < minimum || nombre > maximum) {
    return {
      ok: false,
      erreur: `${nom} doit être comprise entre ${minimum} et ${maximum}.`,
    }
  }

  return { ok: true, valeur: nombre }
}

function validerDescription(valeur) {
  if (valeur === undefined || valeur === null) {
    return { ok: true, valeur: null }
  }
  if (typeof valeur !== 'string') {
    return { ok: false, erreur: 'La description doit être un texte.' }
  }

  const texte = valeur.trim().slice(0, DESCRIPTION_MAX)
  return { ok: true, valeur: texte === '' ? null : texte }
}

function validerPhotoUrl(valeur) {
  if (valeur === undefined || valeur === null) {
    return { ok: true, valeur: null }
  }
  if (typeof valeur !== 'string') {
    return { ok: false, erreur: 'photo_url doit être une chaîne de caractères.' }
  }

  const url = valeur.trim()
  if (!url.startsWith('https://') || url.length <= 'https://'.length) {
    return { ok: false, erreur: 'photo_url doit commencer par https://' }
  }

  return { ok: true, valeur: url }
}

// Validation complète du corps de POST /api/signalements.
export function validerNouveauSignalement(corps) {
  if (!corps || typeof corps !== 'object' || Array.isArray(corps)) {
    return { ok: false, erreur: 'Corps de requête invalide.' }
  }

  if (
    typeof corps.type !== 'string' ||
    !TYPES_SIGNALEMENT.includes(corps.type)
  ) {
    return {
      ok: false,
      erreur: `Type invalide. Valeurs autorisées : ${TYPES_SIGNALEMENT.join(', ')}.`,
    }
  }

  const latitude = validerCoordonnee(corps.latitude, -90, 90, 'La latitude')
  if (!latitude.ok) return latitude

  const longitude = validerCoordonnee(
    corps.longitude,
    -180,
    180,
    'La longitude'
  )
  if (!longitude.ok) return longitude

  const description = validerDescription(corps.description)
  if (!description.ok) return description

  const photoUrl = validerPhotoUrl(corps.photo_url)
  if (!photoUrl.ok) return photoUrl

  const deviceId = validerDeviceId(corps.device_id)
  if (!deviceId.ok) return deviceId

  return {
    ok: true,
    valeur: {
      type: corps.type,
      latitude: latitude.valeur,
      longitude: longitude.valeur,
      description: description.valeur,
      photo_url: photoUrl.valeur,
      device_id: deviceId.valeur,
    },
  }
}

// Filtres optionnels de GET /api/signalements.
export function validerFiltres(type, statut) {
  if (type !== null && !TYPES_SIGNALEMENT.includes(type)) {
    return {
      ok: false,
      erreur: `Type de filtre invalide. Valeurs autorisées : ${TYPES_SIGNALEMENT.join(', ')}.`,
    }
  }

  if (statut !== null && !STATUTS_SIGNALEMENT.includes(statut)) {
    return {
      ok: false,
      erreur: `Statut de filtre invalide. Valeurs autorisées : ${STATUTS_SIGNALEMENT.join(', ')}.`,
    }
  }

  return { ok: true, valeur: { type, statut } }
}

export function lireLimite(valeur) {
  const nombre = Number.parseInt(valeur ?? '', 10)
  if (!Number.isFinite(nombre) || nombre <= 0) return LIMITE_DEFAUT
  return Math.min(nombre, LIMITE_MAX)
}
