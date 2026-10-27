'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/routepulse/BottomNav'
import { User, MapPin, Shield, Bell, ChevronRight, LogOut, Award, TrendingUp } from 'lucide-react'

export default function ProfilePage() {
  const [stats, setStats] = useState({ total: 0, confirmes: 0, last24h: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('signalements')
        .select('statut, created_at')
      if (error) throw error

      const total = data.length
      const confirmes = data.filter(s => s.statut === 'confirme').length
      const last24h = data.filter(s =>
        Date.now() - new Date(s.created_at) < 86400000
      ).length

      setStats({ total, confirmes, last24h })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const niveau = stats.total >= 20 ? 'Expert' :
                 stats.total >= 10 ? 'Confirmé' :
                 stats.total >= 5  ? 'Actif' : 'Débutant'

  const niveauColor = stats.total >= 20 ? 'text-purple-600' :
                      stats.total >= 10 ? 'text-blue-600' :
                      stats.total >= 5  ? 'text-green-600' : 'text-gray-500'

  const menuItems = [
    { icon: Bell,   label: 'Notifications',  sub: 'Alertes zones proches' },
    { icon: MapPin, label: 'Ma zone',         sub: "Abidjan, Côte d'Ivoire" },
    { icon: Shield, label: 'Confidentialité', sub: 'Données anonymisées' },
  ]

  const statCards = [
    { icon: MapPin,      label: 'Signalements', value: stats.total,     color: 'text-green-700' },
    { icon: Award,       label: 'Confirmés',    value: stats.confirmes, color: 'text-red-600'   },
    { icon: TrendingUp,  label: "Aujourd'hui",  value: stats.last24h,   color: 'text-blue-600'  },
  ]

  const badges = [
    { emoji: '🗺️', label: 'Explorateur', unlocked: stats.total >= 1   },
    { emoji: '📸', label: 'Photographe', unlocked: stats.total >= 3   },
    { emoji: '⚡', label: 'Réactif',     unlocked: stats.last24h >= 1 },
    { emoji: '🏆', label: 'Expert',      unlocked: stats.total >= 20  },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-green-800 text-white px-4 pt-8 pb-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mb-3 text-4xl">
            👤
          </div>
          <h1 className="text-xl font-bold">Citoyen Abidjanais</h1>
          <p className="text-green-200 text-sm mt-1">Contributeur RoutePulse</p>
          <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold bg-white ${niveauColor}`}>
            ⭐ {niveau}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 pb-24">

        {/* Stats personnelles */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
              <card.icon size={18} className={`mx-auto mb-1 ${card.color}`} />
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-400">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Progression */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800 text-sm">Progression</span>
            <span className={`text-xs font-bold ${niveauColor}`}>{niveau}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
            <div
              className="h-2.5 rounded-full bg-green-600 transition-all"
              style={{ width: `${Math.min((stats.total / 20) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {stats.total < 5  && `${5 - stats.total} signalement(s) pour devenir Actif`}
            {stats.total >= 5  && stats.total < 10 && `${10 - stats.total} signalement(s) pour devenir Confirmé`}
            {stats.total >= 10 && stats.total < 20 && `${20 - stats.total} signalement(s) pour devenir Expert`}
            {stats.total >= 20 && '🏆 Niveau maximum atteint !'}
          </p>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="font-semibold text-gray-800 mb-3">Badges obtenus</p>
          <div className="flex gap-3 flex-wrap">
            {badges.map((badge) => (
              <div
                key={badge.label}
                className={`flex flex-col items-center p-3 rounded-xl border-2 ${badge.unlocked ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 opacity-40'}`}
                style={{ minWidth: 64 }}
              >
                <span className="text-2xl mb-1">{badge.emoji}</span>
                <span className="text-xs font-medium text-gray-600">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu paramètres */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <item.icon size={18} className="text-green-700" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Impact citoyen */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="font-bold text-green-800 text-sm mb-1">🌍 Ton impact citoyen</p>
          <p className="text-xs text-green-700 leading-relaxed">
            Grâce à tes <strong>{stats.total}</strong> signalement(s), tu contribues à rendre les routes d'Abidjan plus sûres pour tous les usagers.
          </p>
        </div>

        {/* Déconnexion */}
        <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-red-200 text-red-500 font-semibold hover:bg-red-50 transition-colors">
          <LogOut size={18} />
          Se déconnecter
        </button>

      </div>
      <BottomNav />
    </div>
  )
}