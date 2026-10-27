'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/routepulse/BottomNav'
import { BarChart2, AlertTriangle, MapPin, TrendingUp, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const TYPE_CONFIG = {
  'nid-de-poule': { emoji: '🕳️', label: 'Nid-de-poule', color: '#F57C00' },
  'accident':     { emoji: '🚗', label: 'Accident',      color: '#D32F2F' },
  'embouteillage':{ emoji: '🚦', label: 'Embouteillage', color: '#FBC02D' },
  'inondation':   { emoji: '💧', label: 'Inondation',    color: '#1976D2' },
  'obstacle':     { emoji: '⚠️', label: 'Obstacle',      color: '#7B1FA2' },
  'autre':        { emoji: '📍', label: 'Autre',         color: '#455A64' },
}

export default function DashboardPage() {
  const [stats,     setStats]     = useState({ total: 0, confirmes: 0, isoles: 0, last24h: 0 })
  const [byType,    setByType]    = useState([])
  const [topZones,  setTopZones]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    loadStats()
    const channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signalements' },
        () => loadStats()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const loadStats = async () => {
    try {
      // ── Requête 1 : stats générales
      const { data, error } = await supabase
        .from('signalements')
        .select('type, statut, created_at')
      if (error) throw error

      const total     = data.length
      const confirmes = data.filter(s => s.statut === 'confirme').length
      const isoles    = data.filter(s => s.statut === 'isole').length
      const last24h   = data.filter(s =>
        Date.now() - new Date(s.created_at) < 86400000
      ).length

      const typeCount = data.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1
        return acc
      }, {})

      const chartData = Object.entries(typeCount).map(([type, count]) => ({
        name:  TYPE_CONFIG[type]?.label || type,
        value: count,
        color: TYPE_CONFIG[type]?.color || '#888',
        emoji: TYPE_CONFIG[type]?.emoji || '📍',
      }))

      setStats({ total, confirmes, isoles, last24h })
      setByType(chartData)

      // ── Requête 2 : top 5 zones réelles (signalements confirmés)
      const { data: topData, error: topError } = await supabase
        .from('signalements')
        .select('latitude, longitude, type, statut')
        .eq('statut', 'confirme')

      if (!topError && topData?.length > 0) {
        // Clustering géographique — arrondi 2 décimales ≈ rayon ~1km
        const zoneMap = {}
        topData.forEach(sig => {
          const key = `${sig.latitude.toFixed(2)},${sig.longitude.toFixed(2)}`
          zoneMap[key] = (zoneMap[key] || 0) + 1
        })

        const zones = Object.entries(zoneMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([coords, count]) => {
            const [lat, lng] = coords.split(',').map(Number)
            return {
              coords: `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
              count,
              niveau: count >= 5 ? 'Très élevé' :
                      count >= 3 ? 'Élevé'      :
                      count >= 2 ? 'Moyen'      : 'Faible',
              color:  count >= 5 ? 'text-red-600'    :
                      count >= 3 ? 'text-orange-500' :
                      count >= 2 ? 'text-yellow-500' : 'text-green-600',
            }
          })

        setTopZones(zones)
      } else {
        setTopZones([])
      }

    } catch (err) {
      console.error('Dashboard loadStats error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-green-800 text-white px-4 py-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={22} />
          <div>
            <h1 className="text-lg font-bold">Tableau de bord</h1>
            <p className="text-green-200 text-sm">Vue d'ensemble des signalements</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-800" />
          </div>
        ) : (
          <>
            {/* ── KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: MapPin,      label: 'Total signalements', value: stats.total,     color: 'text-gray-800',   iconColor: 'text-green-700' },
                { icon: AlertTriangle,label: 'Zones critiques',   value: stats.confirmes, color: 'text-red-600',    iconColor: 'text-red-500'   },
                { icon: TrendingUp,  label: 'Activité 24h',       value: stats.last24h,   color: 'text-blue-600',   iconColor: 'text-blue-500'  },
                { icon: Clock,       label: 'Isolés',             value: stats.isoles,    color: 'text-orange-500', iconColor: 'text-orange-500'},
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <card.icon size={16} className={card.iconColor} />
                    <span className="text-xs text-gray-500">{card.label}</span>
                  </div>
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* ── Graphique donut */}
            {byType.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="font-bold text-gray-800 mb-3">Répartition par type</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={byType}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      paddingAngle={3} dataKey="value"
                    >
                      {byType.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend
                      formatter={(value, entry) => (
                        <span className="text-xs">{entry.payload.emoji} {value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Barres par catégorie */}
            {byType.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="font-bold text-gray-800 mb-3">Signalements par catégorie</p>
                <div className="space-y-3">
                  {[...byType].sort((a, b) => b.value - a.value).map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.emoji} {item.name}</span>
                        <span className="font-bold" style={{ color: item.color }}>
                          {item.value}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: stats.total > 0
                              ? `${(item.value / stats.total) * 100}%`
                              : '0%',
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Top 5 zones critiques (données réelles) */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="font-bold text-gray-800 mb-3">Top 5 zones critiques</p>

              {topZones.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <AlertTriangle size={32} className="text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm">Aucune zone confirmée pour l'instant</p>
                  <p className="text-gray-300 text-xs mt-1">
                    Les zones avec plusieurs signalements confirmés apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topZones.map((zone, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-bold w-5">{i + 1}.</span>
                        <div>
                          <p className="text-gray-700 text-sm font-medium">
                            Zone {zone.coords}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {zone.count} signalement{zone.count > 1 ? 's' : ''} confirmé{zone.count > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${zone.color}`}>
                        {zone.niveau}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Bandeau impact */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-bold text-green-800 text-sm mb-1">
                🌍 Impact collectif
              </p>
              <p className="text-xs text-green-700 leading-relaxed">
                <strong>{stats.total}</strong> signalement{stats.total > 1 ? 's' : ''} soumis
                par la communauté RoutePulse à Abidjan.{' '}
                <strong>{stats.confirmes}</strong> zone{stats.confirmes > 1 ? 's' : ''} confirmée{stats.confirmes > 1 ? 's' : ''} grâce à vos contributions.
              </p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}