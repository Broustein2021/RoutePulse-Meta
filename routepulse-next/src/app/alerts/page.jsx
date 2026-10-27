'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/routepulse/BottomNav'
import { AlertTriangle, MapPin, Clock, ChevronRight } from 'lucide-react'

const TYPE_CONFIG = {
  'nid-de-poule': { emoji: '🕳️', color: 'bg-orange-100 text-orange-700 border-orange-200', badge: 'bg-orange-500' },
  'accident': { emoji: '🚗', color: 'bg-red-100 text-red-700 border-red-200', badge: 'bg-red-500' },
  'embouteillage': { emoji: '🚦', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', badge: 'bg-yellow-500' },
  'inondation': { emoji: '💧', color: 'bg-blue-100 text-blue-700 border-blue-200', badge: 'bg-blue-500' },
  'obstacle': { emoji: '⚠️', color: 'bg-purple-100 text-purple-700 border-purple-200', badge: 'bg-purple-500' },
  'autre': { emoji: '📍', color: 'bg-gray-100 text-gray-700 border-gray-200', badge: 'bg-gray-500' },
}

const GRAVITE_LABEL = { 1: 'Faible', 2: 'Moyen', 3: 'Élevé' }
const GRAVITE_COLOR = { 1: 'text-green-600', 2: 'text-orange-500', 3: 'text-red-600' }

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff/60)}min`
  if (diff < 86400) return `${Math.floor(diff/3600)}h`
  return `${Math.floor(diff/86400)}j`
}

export default function AlertsPage() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')

  useEffect(() => {
    loadZones()
    const channel = supabase
      .channel('alerts-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signalements' },
        () => loadZones()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const loadZones = async () => {
    try {
      let query = supabase
        .from('signalements')
        .select('*')
        .eq('statut', 'confirme')
        .order('score_gravite', { ascending: false })
        .order('created_at', { ascending: false })

      if (filter !== 'tous') query = query.eq('type', filter)

      const { data, error } = await query
      if (error) throw error
      setZones(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadZones() }, [filter])

  const FILTERS = [
    { id: 'tous', label: 'Tous' },
    { id: 'accident', label: '🚗 Accidents' },
    { id: 'nid-de-poule', label: '🕳️ Routes' },
    { id: 'inondation', label: '💧 Inondations' },
    { id: 'embouteillage', label: '🚦 Trafic' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={22} />
          <h1 className="text-lg font-bold">Zones dangereuses</h1>
        </div>
        <p className="text-red-100 text-sm">Zones confirmées avec signalements multiples</p>
      </div>

      {/* Filtres */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filter === f.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compteur */}
      <div className="px-4 py-2 bg-red-50 border-b border-red-100">
        <p className="text-red-700 text-sm font-medium">
          ⚠️ {zones.length} zone{zones.length > 1 ? 's' : ''} confirmée{zones.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Liste */}
      <div className="flex-1 px-4 py-3 space-y-3 pb-24">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))
        ) : zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Aucune zone dangereuse confirmée</p>
            <p className="text-gray-400 text-sm mt-1">Les zones avec 3+ signalements apparaîtront ici</p>
          </div>
        ) : (
          zones.map((zone) => {
            const config = TYPE_CONFIG[zone.type] || TYPE_CONFIG['autre']
            return (
              <div key={zone.id} className={`bg-white rounded-xl p-4 shadow-sm border ${config.color}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{config.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800 capitalize">
                          {zone.type.replace('-', ' ')}
                        </span>
                        <span className={`text-xs font-bold ${GRAVITE_COLOR[zone.score_gravite]}`}>
                          {GRAVITE_LABEL[zone.score_gravite]}
                        </span>
                      </div>
                      {zone.description && (
                        <p className="text-sm text-gray-600 mb-2">{zone.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          il y a {timeAgo(zone.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`${config.badge} text-white text-xs px-2 py-1 rounded-full font-bold ml-2`}>
                    ✓ Confirmé
                  </div>
                </div>
                {zone.photo_url && (
                  <img
                    src={zone.photo_url}
                    alt="signalement"
                    className="mt-3 w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>
            )
          })
        )}
      </div>

      <BottomNav />
    </div>
  )
}