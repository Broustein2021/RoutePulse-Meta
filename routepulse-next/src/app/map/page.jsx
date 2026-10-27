'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/routepulse/BottomNav'
import { AlertTriangle } from 'lucide-react'

const TYPE_CONFIG = {
  'nid-de-poule': { emoji: '🕳️', color: '#F57C00' },
  'accident':     { emoji: '🚗', color: '#D32F2F' },
  'embouteillage':{ emoji: '🚦', color: '#FBC02D' },
  'inondation':   { emoji: '💧', color: '#1976D2' },
  'obstacle':     { emoji: '⚠️', color: '#7B1FA2' },
  'autre':        { emoji: '📍', color: '#455A64' },
}

export default function MapPage() {
  const [signalements, setSignalements] = useState([])
  const [MapComponents, setMapComponents] = useState(null)

  useEffect(() => {
    // Chargement dynamique Leaflet (SSR-safe)
    import('leaflet').then(L => {
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
    })

    import('react-leaflet').then(({ MapContainer, TileLayer, CircleMarker, Popup }) => {
      setMapComponents({ MapContainer, TileLayer, CircleMarker, Popup })
    })

    loadSignalements()

    // Temps réel
    const channel = supabase
      .channel('map-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signalements' },
        () => loadSignalements()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const loadSignalements = async () => {
    const { data } = await supabase
      .from('signalements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setSignalements(data || [])
  }

  if (!MapComponents) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-800 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Chargement de la carte...</p>
      </div>
    </div>
  )

  const { MapContainer, TileLayer, CircleMarker, Popup } = MapComponents

  return (
    <div className="flex flex-col" style={{ height: '100vh' }}>

      {/* Carte — hauteur = écran - BottomNav (64px) */}
      <div style={{ height: 'calc(100vh - 64px)', position: 'relative' }}>
        <MapContainer
          center={[5.3599, -4.0083]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {signalements.map(sig => {
            const config = TYPE_CONFIG[sig.type] || TYPE_CONFIG['autre']
            const radius = sig.statut === 'confirme' ? 14 : 8
            return (
              <CircleMarker
                key={sig.id}
                center={[sig.latitude, sig.longitude]}
                radius={radius}
                pathOptions={{
                  color: config.color,
                  fillColor: config.color,
                  fillOpacity: sig.statut === 'confirme' ? 0.85 : 0.45,
                  weight: sig.statut === 'confirme' ? 3 : 1,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold mb-1">
                      {config.emoji} {sig.type.replace('-', ' ')}
                    </p>
                    {sig.description && (
                      <p className="text-gray-600 mb-1">{sig.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {sig.statut === 'confirme' ? '✅ Confirmé' : '⏳ Isolé'}
                    </p>
                    {sig.photo_url && (
                      <img
                        src={sig.photo_url}
                        alt="photo"
                        className="mt-2 w-32 h-24 object-cover rounded"
                      />
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* Légende */}
        <div className="absolute top-3 right-3 z-[1000] bg-white rounded-xl p-3 shadow-lg text-xs space-y-1.5">
          <p className="font-bold text-gray-700 mb-2">Légende</p>
          {Object.entries(TYPE_CONFIG).slice(0, 4).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
              <span className="text-gray-600">{cfg.emoji} {type.replace('-', ' ')}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-1.5 mt-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-transparent" />
              <span className="text-gray-500">Isolé</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-gray-500">Confirmé</span>
            </div>
          </div>
        </div>

        {/* Compteur live */}
        <div className="absolute bottom-4 left-3 z-[1000] bg-white rounded-xl px-3 py-2 shadow-lg">
          <p className="text-xs font-bold text-gray-700">
            📍 {signalements.length} signalement(s) actif(s)
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}