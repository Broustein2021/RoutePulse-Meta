'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ICONS = {
  'nid-de-poule': { color: '#F57C00', emoji: '🕳️' },
  'accident': { color: '#D32F2F', emoji: '🚗' },
  'embouteillage': { color: '#FBC02D', emoji: '🚦' },
  'inondation': { color: '#1976D2', emoji: '💧' },
  'obstacle': { color: '#7B1FA2', emoji: '⚠️' },
  'autre': { color: '#455A64', emoji: '📍' },
}

const createIcon = (type, statut) => {
  const config = ICONS[type] || ICONS['autre']
  const size = statut === 'confirme' ? 40 : 30
  return L.divIcon({
    html: `
      <div style="
        background: ${config.color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.5}px;
        border: ${statut === 'confirme' ? '3px solid white' : '2px solid rgba(255,255,255,0.7)'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${config.emoji}
      </div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  })
}

export default function TrafficMap({ signalements = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (mapInstanceRef.current) return

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [5.3364, -4.0267],
      zoom: 12,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    signalements.forEach(s => {
      if (!s.latitude || !s.longitude) return
      const marker = L.marker([s.latitude, s.longitude], {
        icon: createIcon(s.type, s.statut)
      })
      .bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <div style="font-weight: bold; color: ${ICONS[s.type]?.color}; margin-bottom: 4px;">
            ${ICONS[s.type]?.emoji} ${s.type.replace('-', ' ').toUpperCase()}
          </div>
          ${s.statut === 'confirme' ? '<span style="background:#D32F2F;color:white;padding:2px 6px;border-radius:10px;font-size:11px;">✓ Zone confirmée</span>' : '<span style="background:#888;color:white;padding:2px 6px;border-radius:10px;font-size:11px;">Signalement isolé</span>'}
          ${s.description ? `<p style="margin-top:6px;font-size:12px;color:#555">${s.description}</p>` : ''}
          <p style="margin-top:4px;font-size:11px;color:#999">${new Date(s.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
      `)
      .addTo(mapInstanceRef.current)
      markersRef.current.push(marker)
    })
  }, [signalements])

  return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />
}