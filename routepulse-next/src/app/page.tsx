'use client'
import { useEffect, useState } from 'react'
import { supabase, getSignalements, getStats } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/routepulse/BottomNav'

const MapComponent = dynamic(
  () => import('@/components/routepulse/TrafficMap'),
  { ssr: false }
)

export default function Home() {
  const [signalements, setSignalements] = useState([])
  const [stats, setStats] = useState({ total: 0, confirmes: 0, byType: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('signalements-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signalements' },
        (payload) => {
          setSignalements(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const loadData = async () => {
    try {
      const [data, statsData] = await Promise.all([
        getSignalements(),
        getStats()
      ])
      setSignalements(data)
      setStats(statsData)
    } catch (err) {
      console.error('Erreur chargement:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col h-screen bg-gray-50">
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

      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement de la carte...</p>
            </div>
          </div>
        ) : (
          <MapComponent signalements={signalements} />
        )}
      </div>

      <BottomNav />
    </main>
  )
}