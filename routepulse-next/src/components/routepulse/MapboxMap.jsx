'use client'
import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const SOURCE_ID = 'signalements'
const COUCHE_CLUSTERS = 'signalements-clusters'
const COUCHE_COMPTEUR = 'signalements-clusters-count'
const COUCHE_POINTS = 'signalements-points'

const TYPES = {
  'nid-de-poule': { couleur: '#F57C00', emoji: '🕳️' },
  accident: { couleur: '#D32F2F', emoji: '🚗' },
  embouteillage: { couleur: '#FBC02D', emoji: '🚦' },
  inondation: { couleur: '#1976D2', emoji: '💧' },
  obstacle: { couleur: '#7B1FA2', emoji: '⚠️' },
  autre: { couleur: '#455A64', emoji: '📍' },
}

// Prépare les données au format GeoJSON attendu par Mapbox.
function versGeoJSON(liste) {
  const features = (Array.isArray(liste) ? liste : [])
    .map((signalement) => {
      if (
        signalement == null ||
        signalement.latitude == null ||
        signalement.longitude == null
      ) {
        return null
      }

      const latitude = Number(signalement.latitude)
      const longitude = Number(signalement.longitude)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        properties: {
          id: signalement.id ?? '',
          type: signalement.type ?? 'autre',
          statut: signalement.statut ?? 'isole',
          description: signalement.description ?? '',
          photo_url: signalement.photo_url ?? '',
          score_gravite: signalement.score_gravite ?? 1,
          created_at: signalement.created_at ?? '',
          nb_confirmations: signalement.nb_confirmations ?? 0,
        },
      }
    })
    .filter(Boolean)

  return { type: 'FeatureCollection', features }
}

// Construit le contenu du popup uniquement avec des nœuds DOM et textContent.
// Aucune donnée utilisateur n'est injectée sous forme de HTML.
function creerContenuPopup(proprietes) {
  const conteneur = document.createElement('div')
  conteneur.style.fontFamily = 'sans-serif'
  conteneur.style.minWidth = '180px'

  const type =
    typeof proprietes.type === 'string' && proprietes.type !== ''
      ? proprietes.type
      : 'autre'
  const config = TYPES[type] || TYPES.autre

  const titre = document.createElement('div')
  titre.style.fontWeight = 'bold'
  titre.style.color = config.couleur
  titre.style.marginBottom = '4px'
  titre.textContent = `${config.emoji} ${type.replace(/-/g, ' ')}`
  conteneur.appendChild(titre)

  const badge = document.createElement('span')
  badge.style.padding = '2px 6px'
  badge.style.borderRadius = '10px'
  badge.style.fontSize = '11px'
  badge.style.color = '#FFFFFF'
  if (proprietes.statut === 'confirme') {
    badge.style.background = '#D32F2F'
    badge.textContent = 'Zone confirmée'
  } else {
    badge.style.background = '#888888'
    badge.textContent = 'Signalement isolé'
  }
  conteneur.appendChild(badge)

  const description =
    typeof proprietes.description === 'string'
      ? proprietes.description.trim()
      : ''
  if (description !== '') {
    const paragraphe = document.createElement('p')
    paragraphe.style.marginTop = '6px'
    paragraphe.style.fontSize = '12px'
    paragraphe.style.color = '#555555'
    paragraphe.textContent = description
    conteneur.appendChild(paragraphe)
  }

  if (proprietes.created_at) {
    const date = new Date(proprietes.created_at)
    if (!Number.isNaN(date.getTime())) {
      const ligneDate = document.createElement('p')
      ligneDate.style.marginTop = '4px'
      ligneDate.style.fontSize = '11px'
      ligneDate.style.color = '#999999'
      ligneDate.textContent = date.toLocaleDateString('fr-FR')
      conteneur.appendChild(ligneDate)
    }
  }

  const photoUrl =
    typeof proprietes.photo_url === 'string'
      ? proprietes.photo_url.trim()
      : ''
  if (photoUrl.startsWith('https://')) {
    const image = document.createElement('img')
    image.src = photoUrl
    image.alt = 'Photo du signalement'
    image.loading = 'lazy'
    image.style.width = '100%'
    image.style.maxHeight = '120px'
    image.style.objectFit = 'cover'
    image.style.borderRadius = '6px'
    image.style.marginTop = '6px'
    image.style.display = 'block'
    conteneur.appendChild(image)
  }

  return conteneur
}

export default function MapboxMap({ signalements = [], className = '' }) {
  const conteneurRef = useRef(null)
  const carteRef = useRef(null)
  const signalementsRef = useRef(signalements)
  const [erreurCarte, setErreurCarte] = useState(null)

  // Le composant a sa propre hauteur : il ne dépend pas de la chaîne des
  // parents pour être visible (sinon la carte peut se retrouver à 0 px).
  const stylesRacine = {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '400px',
  }

  // Mise à jour de la source quand les données changent (sans recréer la carte).
  useEffect(() => {
    signalementsRef.current = signalements

    const carte = carteRef.current
    if (!carte) return

    const source = carte.getSource(SOURCE_ID)
    if (source) source.setData(versGeoJSON(signalements))
  }, [signalements])

  useEffect(() => {
    if (!MAPBOX_TOKEN || carteRef.current || !conteneurRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const carte = new mapboxgl.Map({
      container: conteneurRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-4.0267, 5.3364],
      zoom: 12,
      logoPosition: 'top-left',
    })
    carteRef.current = carte

    // Erreur de chargement (style, tuiles, réseau) : message générique en
    // français. Le token et l'URL de la requête ne sont jamais affichés.
    carte.on('error', () => {
      setErreurCarte(
        "La carte n'a pas pu être chargée. Vérifiez votre connexion puis réessayez."
      )
    })

    carte.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-left'
    )
    carte.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-left'
    )

    // Force un premier calcul de taille une fois le conteneur monté.
    carte.resize()

    // Le conteneur peut changer de taille (rotation, resize, navigation) :
    // on recale le canvas à chaque fois.
    let observateurTaille = null
    if (typeof ResizeObserver !== 'undefined') {
      observateurTaille = new ResizeObserver(() => {
        carte.resize()
      })
      observateurTaille.observe(conteneurRef.current)
    }

    carte.on('load', () => {
      carte.resize()

      carte.addSource(SOURCE_ID, {
        type: 'geojson',
        data: versGeoJSON(signalementsRef.current),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })

      // Regroupements
      carte.addLayer({
        id: COUCHE_CLUSTERS,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#166534',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            10,
            24,
            100,
            30,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      })

      carte.addLayer({
        id: COUCHE_COMPTEUR,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#FFFFFF',
        },
      })

      // Points individuels
      carte.addLayer({
        id: COUCHE_POINTS,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'type'],
            'nid-de-poule',
            '#F57C00',
            'accident',
            '#D32F2F',
            'embouteillage',
            '#FBC02D',
            'inondation',
            '#1976D2',
            'obstacle',
            '#7B1FA2',
            '#455A64',
          ],
          'circle-radius': [
            'case',
            ['==', ['get', 'statut'], 'confirme'],
            12,
            8,
          ],
          'circle-stroke-width': [
            'case',
            ['==', ['get', 'statut'], 'confirme'],
            3,
            1.5,
          ],
          'circle-stroke-color': '#FFFFFF',
        },
      })

      // Clic sur un regroupement : zoom sur la zone.
      carte.on('click', COUCHE_CLUSTERS, (evenement) => {
        const feature = evenement.features && evenement.features[0]
        if (!feature) return

        const source = carte.getSource(SOURCE_ID)
        if (!source || typeof source.getClusterExpansionZoom !== 'function') {
          return
        }

        source.getClusterExpansionZoom(
          feature.properties.cluster_id,
          (erreur, zoom) => {
            if (erreur) {
              console.error('Mapbox cluster:', erreur)
              return
            }
            carte.easeTo({
              center: feature.geometry.coordinates,
              zoom,
            })
          }
        )
      })

      // Clic sur un point : popup construit en DOM.
      carte.on('click', COUCHE_POINTS, (evenement) => {
        const feature = evenement.features && evenement.features[0]
        if (!feature) return

        new mapboxgl.Popup({ offset: 12, maxWidth: '260px' })
          .setLngLat(feature.geometry.coordinates)
          .setDOMContent(creerContenuPopup(feature.properties))
          .addTo(carte)
      })

      const curseurPointeur = () => {
        carte.getCanvas().style.cursor = 'pointer'
      }
      const curseurNormal = () => {
        carte.getCanvas().style.cursor = ''
      }

      carte.on('mouseenter', COUCHE_CLUSTERS, curseurPointeur)
      carte.on('mouseleave', COUCHE_CLUSTERS, curseurNormal)
      carte.on('mouseenter', COUCHE_POINTS, curseurPointeur)
      carte.on('mouseleave', COUCHE_POINTS, curseurNormal)
    })

    return () => {
      if (observateurTaille) observateurTaille.disconnect()
      carte.remove()
      carteRef.current = null
    }
  }, [])

  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={stylesRacine}
        className={`flex items-center justify-center bg-gray-50 ${className}`}
      >
        <p className="max-w-xs px-4 text-center text-sm text-gray-600">
          Carte indisponible : le token Mapbox
          (NEXT_PUBLIC_MAPBOX_TOKEN) n&apos;est pas configuré.
        </p>
      </div>
    )
  }

  return (
    <div style={stylesRacine} className={className}>
      <div
        ref={conteneurRef}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* Message d'erreur discret par-dessus la carte */}
      {erreurCarte && (
        <div className="absolute top-3 left-1/2 z-[2] -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow">
          {erreurCarte}
        </div>
      )}

      {/* Légende des couleurs par type */}
      <div className="absolute bottom-20 left-3 z-[1] space-y-1.5 rounded-xl bg-white/95 p-3 text-xs shadow-lg">
        <p className="mb-2 font-bold text-gray-700">Légende</p>
        {Object.entries(TYPES).map(([type, config]) => (
          <div key={type} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: config.couleur }}
            />
            <span className="text-gray-600">
              {config.emoji} {type.replace(/-/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
