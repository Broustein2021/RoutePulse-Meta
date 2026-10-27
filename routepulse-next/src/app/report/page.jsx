'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/routepulse/BottomNav'
import { MapPin, Camera, Send, X, CheckCircle } from 'lucide-react'

const CATEGORIES = [
  { id: 'nid-de-poule', label: 'Nid-de-poule', emoji: '🕳️', color: '#F57C00' },
  { id: 'accident', label: 'Accident', emoji: '🚗', color: '#D32F2F' },
  { id: 'embouteillage', label: 'Embouteillage', emoji: '🚦', color: '#FBC02D' },
  { id: 'inondation', label: 'Inondation', emoji: '💧', color: '#1976D2' },
  { id: 'obstacle', label: 'Obstacle', emoji: '⚠️', color: '#7B1FA2' },
  { id: 'autre', label: 'Autre', emoji: '📍', color: '#455A64' },
]

export default function ReportPage() {
  const router = useRouter()
  const [category, setCategory] = useState(null)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // Fallback sur Abidjan centre si géoloc refusée
        setLocation({ lat: 5.3364, lng: -4.0267 })
        setLocationError('Position approximative (Abidjan)')
      }
    )
  }, [])

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!category || !location) return
    setLoading(true)
    try {
      let photo_url = null

      // Upload photo si présente
      if (photo) {
        const filename = `${Date.now()}-${photo.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filename, photo)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filename)
          photo_url = urlData.publicUrl
        }
      }

      // Insérer le signalement
      const { error } = await supabase.from('signalements').insert([{
        type: category,
        latitude: location.lat,
        longitude: location.lng,
        description: description.trim() || null,
        photo_url,
        statut: 'isole',
        score_gravite: 1,
      }])

      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    } catch (err) {
      console.error('Erreur signalement:', err)
      alert('Erreur lors de l\'envoi. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-green-50">
        <CheckCircle size={80} className="text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-green-800 mb-2">Signalement envoyé !</h2>
        <p className="text-gray-600">Merci pour votre contribution.</p>
        <p className="text-gray-400 text-sm mt-2">Redirection en cours...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-800 text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white">
            <X size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Nouveau signalement</h1>
            <p className="text-green-200 text-sm">Aidez à améliorer la sécurité routière</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-24">
        {/* Localisation */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={18} className="text-green-700" />
            <span className="font-semibold text-gray-800">Localisation</span>
          </div>
          {location ? (
            <div>
              <p className="text-green-700 text-sm font-medium">✓ Position détectée</p>
              <p className="text-gray-400 text-xs">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
              {locationError && <p className="text-orange-500 text-xs mt-1">{locationError}</p>}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Détection en cours...</p>
          )}
        </div>

        {/* Catégorie */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="font-semibold text-gray-800 mb-3">Catégorie <span className="text-red-500">*</span></p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  category === cat.id
                    ? 'border-green-700 bg-green-50 scale-95'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl mb-1">{cat.emoji}</span>
                <span className="text-xs font-medium text-gray-700 text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="font-semibold text-gray-800 mb-3">
            <Camera size={16} className="inline mr-2" />
            Photo <span className="text-gray-400 text-sm font-normal">(optionnel)</span>
          </p>
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="preview" className="w-full h-40 object-cover rounded-lg" />
              <button
                onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 transition-colors">
              <Camera size={32} className="text-gray-400 mb-2" />
              <span className="text-gray-500 text-sm">Ajouter une photo</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            </label>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="font-semibold text-gray-800 mb-3">
            Description <span className="text-gray-400 text-sm font-normal">(optionnel)</span>
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
            placeholder="Décrivez la situation..."
            className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none text-sm focus:outline-none focus:border-green-500"
          />
          <p className="text-right text-gray-400 text-xs mt-1">{description.length}/200</p>
        </div>

        {/* Bouton submit */}
        <button
          onClick={handleSubmit}
          disabled={!category || !location || loading}
          className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
            category && location && !loading
              ? 'bg-green-700 hover:bg-green-800 active:scale-95'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <Send size={18} />
              Envoyer le signalement
            </>
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}