'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/routepulse/BottomNav'
import { Heart, MessageCircle, Share2, ShieldCheck,
         Bookmark, Flag, Search, Bell, MapPin, Clock } from 'lucide-react'

const TYPE_CONFIG = {
  'nid-de-poule':  { emoji: '🕳️', label: 'Route dégradée', bgColor: '#FFF7ED', textColor: '#C2410C', borderColor: '#FED7AA' },
  'accident':      { emoji: '🚗', label: 'Accident',        bgColor: '#FEF2F2', textColor: '#B91C1C', borderColor: '#FECACA' },
  'embouteillage': { emoji: '🚦', label: 'Embouteillage',   bgColor: '#FFFBEB', textColor: '#B45309', borderColor: '#FDE68A' },
  'inondation':    { emoji: '💧', label: 'Inondation',      bgColor: '#EFF6FF', textColor: '#1D4ED8', borderColor: '#BFDBFE' },
  'obstacle':      { emoji: '⚠️', label: 'Obstacle',        bgColor: '#F5F3FF', textColor: '#6D28D9', borderColor: '#DDD6FE' },
  'autre':         { emoji: '📍', label: 'Signalement',     bgColor: '#F9FAFB', textColor: '#374151', borderColor: '#E5E7EB' },
}

const GRAVITE_CONFIG = {
  1: { label: 'Dense',   bgColor: '#FFFBEB', textColor: '#B45309' },
  2: { label: 'Bloqué',  bgColor: '#FEF2F2', textColor: '#B91C1C' },
  3: { label: 'Danger',  bgColor: '#F5F3FF', textColor: '#6D28D9' },
}

const NIVEAUX_CONTRIBUTEUR = {
  0:   { label: 'Nouveau',        color: '#6B7280' },
  5:   { label: 'Actif',          color: '#16A34A' },
  20:  { label: 'Voisin vigilant',color: '#2563EB' },
  50:  { label: 'Contributeur Or',color: '#D97706' },
  100: { label: 'Ambassadeur',    color: '#7C3AED' },
}

function getNiveau(total) {
  const seuils = [100, 50, 20, 5, 0]
  for (const s of seuils) {
    if (total >= s) return NIVEAUX_CONTRIBUTEUR[s]
  }
  return NIVEAUX_CONTRIBUTEUR[0]
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return `il y a ${diff}s`
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400)return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

function initiales(id) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const i = parseInt(id?.slice(-4) || '0', 16) % chars.length
  const j = parseInt(id?.slice(-2) || '0', 16) % chars.length
  return chars[i] + chars[j]
}

function avatarColor(id) {
  const colors = ['#F97316','#EF4444','#8B5CF6','#3B82F6','#10B981','#F59E0B']
  return colors[parseInt(id?.slice(-1) || '0', 16) % colors.length]
}

// ── Carte d'un signalement dans le fil
function SignalementCard({ sig, onLike, onConfirm }) {
  const type    = TYPE_CONFIG[sig.type]    || TYPE_CONFIG['autre']
  const gravite = GRAVITE_CONFIG[sig.score_gravite] || GRAVITE_CONFIG[1]
  const init    = initiales(sig.id)
  const color   = avatarColor(sig.id)
  const niveau  = getNiveau(sig._contributeur_total || 0)
  const liked   = sig._liked || false
  const confirmed = sig._confirmed || false

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

      {/* Header auteur */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: color }}
            >
              {init}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-gray-900">
                  Citoyen {init}
                </span>
                <ShieldCheck size={13} className="text-blue-500" />
                {niveau && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: niveau.color + '18',
                      color: niveau.color,
                    }}
                  >
                    {niveau.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin size={11} color="#9CA3AF" />
                <span className="text-xs text-gray-400">
                  {sig.latitude?.toFixed(3)}, {sig.longitude?.toFixed(3)}
                </span>
                <span className="text-gray-300">·</span>
                <Clock size={11} color="#9CA3AF" />
                <span className="text-xs text-gray-400">
                  {timeAgo(sig.created_at)}
                </span>
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 p-1">
            <Flag size={15} />
          </button>
        </div>
      </div>

      {/* Tags type + gravité + confirmations */}
      <div className="px-4 pb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full border"
            style={{
              background: type.bgColor,
              color: type.textColor,
              borderColor: type.borderColor,
            }}
          >
            {type.emoji} {type.label}
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: gravite.bgColor,
              color: gravite.textColor,
            }}
          >
            {gravite.label}
          </span>
        </div>
        {sig.statut === 'confirme' && (
          <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            <ShieldCheck size={12} />
            {sig._confirms || 0} confirm.
          </span>
        )}
      </div>

      {/* Description */}
      {sig.description && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-800 leading-relaxed">
            {sig.description}
          </p>
        </div>
      )}

      {/* Photo */}
      {sig.photo_url && (
        <div className="px-4 pb-3">
          <img
            src={sig.photo_url}
            alt="signalement"
            className="w-full h-52 object-cover rounded-xl"
          />
        </div>
      )}

      {/* Actions */}
      <div
        className="px-4 py-3 flex items-center justify-between border-t"
        style={{ borderColor: '#F3F4F6' }}
      >
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={() => onLike(sig.id)}
            className="flex items-center gap-1.5 transition-transform active:scale-90"
          >
            <Heart
              size={18}
              fill={liked ? '#EF4444' : 'none'}
              color={liked ? '#EF4444' : '#9CA3AF'}
            />
            <span className="text-xs font-medium text-gray-500">
              {sig._likes || 0}
            </span>
          </button>

          {/* Commentaires (placeholder) */}
          <button className="flex items-center gap-1.5">
            <MessageCircle size={18} color="#9CA3AF" />
            <span className="text-xs font-medium text-gray-500">0</span>
          </button>

          {/* Partager */}
          <button className="flex items-center gap-1.5">
            <Share2 size={18} color="#9CA3AF" />
            <span className="text-xs font-medium text-gray-500">0</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Sauvegarder */}
          <button>
            <Bookmark size={18} color="#9CA3AF" />
          </button>

          {/* Confirmer */}
          <button
            onClick={() => onConfirm(sig.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              confirmed
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-green-50 hover:text-green-600'
            }`}
          >
            <ShieldCheck size={13} />
            {confirmed ? 'Confirmé ✓' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale Feed
export default function FeedPage() {
  const [signalements, setSignalements] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filtre,       setFiltre]       = useState('tendances')
  const [interactions, setInteractions] = useState({}) // { [id]: { liked, confirmed, likes } }

  const filtres = [
    { id: 'tendances', label: '🔥 Tendances' },
    { id: 'recents',   label: '🕐 Récents'   },
    { id: 'autour',    label: '📍 Autour'    },
  ]

  useEffect(() => {
    loadFeed()

    // Temps réel
    const channel = supabase
      .channel('feed-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signalements' },
        () => loadFeed()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [filtre])

  const loadFeed = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('signalements')
        .select('*')

      if (filtre === 'tendances') {
        // Signalements confirmés ou récents avec gravité élevée
        query = query
          .order('score_gravite', { ascending: false })
          .order('created_at',    { ascending: false })
          .limit(20)
      } else if (filtre === 'recents') {
        query = query
          .order('created_at', { ascending: false })
          .limit(20)
      } else {
        // Autour — on prend les plus récents par défaut
        query = query
          .order('created_at', { ascending: false })
          .limit(20)
      }

      const { data, error } = await query
      if (error) throw error

      // Simule les compteurs (likes/confirmations)
      // À remplacer par des vraies tables quand on aura le schema complet
      const enriched = (data || []).map(sig => ({
        ...sig,
        _likes:    Math.floor(Math.random() * 200),
        _confirms: sig.statut === 'confirme'
          ? Math.floor(Math.random() * 40) + 5
          : 0,
        _liked:     false,
        _confirmed: sig.statut === 'confirme',
        _contributeur_total: Math.floor(Math.random() * 120),
      }))

      setSignalements(enriched)
    } catch (err) {
      console.error('Feed error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = (id) => {
    setSignalements(prev => prev.map(sig => {
      if (sig.id !== id) return sig
      const liked = !sig._liked
      return { ...sig, _liked: liked, _likes: sig._likes + (liked ? 1 : -1) }
    }))
  }

  const handleConfirm = async (id) => {
    setSignalements(prev => prev.map(sig => {
      if (sig.id !== id) return sig
      const confirmed = !sig._confirmed
      return {
        ...sig,
        _confirmed: confirmed,
        _confirms:  sig._confirms + (confirmed ? 1 : -1),
      }
    }))

    // Met à jour Supabase si on confirme
    const sig = signalements.find(s => s.id === id)
    if (sig && !sig._confirmed) {
      const newScore = Math.min((sig.score_gravite || 1) + 1, 3)
      const newStatut = newScore >= 2 ? 'confirme' : 'isole'
      await supabase
        .from('signalements')
        .update({ score_gravite: newScore, statut: newStatut })
        .eq('id', id)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Le fil</h1>
            <p className="text-xs text-gray-400">Ce que la ville partage en ce moment</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Search size={16} color="#6B7280" />
            </button>
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center relative">
              <Bell size={16} color="#6B7280" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          {filtres.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltre(f.id)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: filtre === f.id ? '#1F2937' : '#F3F4F6',
                color:      filtre === f.id ? '#FFFFFF' : '#6B7280',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        {loading ? (
          // Skeleton loader
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-40 bg-gray-100 rounded-xl" />
            </div>
          ))
        ) : signalements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-bold text-gray-700">Aucun signalement pour l'instant</p>
            <p className="text-gray-400 text-sm mt-1">
              Sois le premier à signaler quelque chose dans ta zone
            </p>
          </div>
        ) : (
          signalements.map(sig => (
            <SignalementCard
              key={sig.id}
              sig={sig}
              onLike={handleLike}
              onConfirm={handleConfirm}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}