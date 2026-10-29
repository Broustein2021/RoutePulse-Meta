// Client HTTP côté navigateur pour les routes /api de RoutePulse.
// Chaque fonction jette une Error explicite si la réponse n'est pas ok.

const BASE = '/api'

async function lireReponse(reponse) {
  try {
    return await reponse.json()
  } catch {
    return null
  }
}

async function verifierReponse(reponse, action) {
  const corps = await lireReponse(reponse)

  if (!reponse.ok) {
    const message =
      corps && typeof corps.error === 'string' && corps.error.trim() !== ''
        ? corps.error
        : `Impossible de ${action} (erreur ${reponse.status}).`
    throw new Error(message)
  }

  return corps
}

async function requete(url, options, action) {
  let reponse
  try {
    reponse = await fetch(url, options)
  } catch {
    throw new Error(
      'Impossible de joindre le serveur. Vérifiez votre connexion.'
    )
  }
  return verifierReponse(reponse, action)
}

export async function getSignalements({ type, statut, limit } = {}) {
  const parametres = new URLSearchParams()
  if (type) parametres.set('type', type)
  if (statut) parametres.set('statut', statut)
  if (limit !== undefined && limit !== null) {
    parametres.set('limit', String(limit))
  }

  const query = parametres.toString()
  const url = `${BASE}/signalements${query ? `?${query}` : ''}`

  return requete(
    url,
    { method: 'GET', cache: 'no-store' },
    'charger les signalements'
  )
}

export async function getStats() {
  return requete(
    `${BASE}/stats`,
    { method: 'GET', cache: 'no-store' },
    'charger les statistiques'
  )
}

export async function createSignalement(data) {
  return requete(
    `${BASE}/signalements`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    'créer le signalement'
  )
}

export async function confirmSignalement(id, deviceId) {
  return requete(
    `${BASE}/signalements/${encodeURIComponent(id)}/confirm`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    },
    'confirmer le signalement'
  )
}
