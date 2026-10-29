'use client'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/routepulse/BottomNav'
import { getSignalements, getStats } from '@/lib/client-api'
import { usePolling } from '@/hooks/usePolling'

const MapboxMap = dynamic(
  () => import('@/components/routepulse/MapboxMap'),
  { ssr: false }
)

const STATS_VIDES = {
  total: 0,
  confirmes: 0,
  dernieres_24h: 0,
  par_type: [],
}

async function chargerAccueil() {
  const [signalements, stats] = await Promise.all([
    getSignalements(),
    getStats(),
  ])
  return { signalements, stats }
}

export default function Home() {
  const { data, error, loading, refresh } = usePolling(chargerAccueil)

  const signalements = data?.signalements ?? []
  const stats = data?.stats ?? STATS_VIDES

  return (
    <main className="flex flex-col h-dvh bg-gray-50">
      <div className="bg-green-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-orange-400 font-bold text-lg">RoutePulse</span>
          <span className="text-white font-bold text-lg">CI</span>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="bg-green-700 px-2 py-1 rounded-full">
            🗺️ {stats.total} signalements
          </span>
          <span className="bg-red-600 px-2 py-1 rounded-full">
            ⚠️ {stats.confirmes} zones confirmées
          </span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement de la carte...</p>
            </div>
          </div>
        ) : (
          <MapboxMap signalements={signalements} />
        )}

        {error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow">
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
      </div>

      <BottomNav />
    </main>
  )
}
