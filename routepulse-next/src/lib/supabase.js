import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helpers signalements
export const getSignalements = async (filters = {}) => {
  let query = supabase
    .from('signalements')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.statut) query = query.eq('statut', filters.statut)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const createSignalement = async (signalement) => {
  const { data, error } = await supabase
    .from('signalements')
    .insert([signalement])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getStats = async () => {
  const { data, error } = await supabase
    .from('signalements')
    .select('type, statut')

  if (error) throw error

  const total = data.length
  const confirmes = data.filter(s => s.statut === 'confirme').length
  const byType = data.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {})

  return { total, confirmes, byType }
}

export const getZonesCritiques = async () => {
  const { data, error } = await supabase
    .from('signalements')
    .select('*')
    .eq('statut', 'confirme')
    .order('score_gravite', { ascending: false })
    .limit(10)

  if (error) throw error
  return data
}

// Realtime subscription
export const subscribeToSignalements = (callback) => {
  return supabase
    .channel('signalements-live')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'signalements' },
      callback
    )
    .subscribe()
}