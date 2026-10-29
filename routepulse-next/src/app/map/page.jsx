'use client'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/routepulse/BottomNav'
import { getSignalements } from '@/lib/client-api'
import { usePolling } from '@/hooks/usePolling'
import { AlertTriangle } from 'lucide-react'

const TYPE_CONFIG = {
  'nid-de-poule': { emoji: '🕳️', color: '#F57C00' },
  'accident':     { emoji: '🚗', color: '#D32F2F' },
  'embouteillage':{ emoji: '🚦', color: '#FBC02D' },
  'inondation':   { emoji: '💧', color: '#1976D2' },
  'obstacle':     { emoji: '⚠️', color: '#7B1FA2' },
  'autre':        { emoji: '📍', color: '#455A64' },
}

const MapboxMap = dynamic(
  () => import('@/components/routepulse/MapboxMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-800 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement de la carte...</p>
        </div>
      </div>
    ),
  }
)

const chargerSignalements = () => getSignalements({ limit: 300 })

export default function MapPage() {
  const { data, error, refresh } = usePolling(chargerSignalements)
  const signalements = data ?? []

  return (
    <div className="flex h-dvh flex-col">

      {/* Carte — occupe l'écran au-dessus de la BottomNav (64px) */}
      <div className="relative mb-16 min-h-0 flex-1">
        <MapboxMap signalements={signalements} className="h-full w-full" />

        {/* Erreur réseau discrète */}
        {error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow">
            <AlertTriangle size={14} />
            <span>Données momentanément indisponibles.</span>
            <button
              type="button"
              onClick={refresh}
              className="font-semibold underline"
            >
              Réessayer
            </button>
          </div>
        )}

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
