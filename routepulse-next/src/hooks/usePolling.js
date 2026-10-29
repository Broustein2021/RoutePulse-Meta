'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Interroge `fetcher` au montage puis à intervalle régulier.
// Le polling est suspendu quand l'onglet est masqué et reprend au retour.
/**
 * @template T
 * @param {() => Promise<T>} fetcher
 * @param {number} [intervalMs]
 * @returns {{
 *   data: T | null,
 *   error: Error | null,
 *   loading: boolean,
 *   refresh: () => Promise<void>,
 * }}
 */
export function usePolling(fetcher, intervalMs = 10000) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetcherRef = useRef(fetcher)
  const timerRef = useRef(null)
  const monteRef = useRef(false)
  const requeteRef = useRef(0)

  // Garde toujours la dernière version du fetcher sans relancer l'effet.
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const executer = useCallback(async () => {
    const numero = requeteRef.current + 1
    requeteRef.current = numero

    try {
      const resultat = await fetcherRef.current()
      // Ignore les réponses obsolètes ou arrivées après démontage.
      if (!monteRef.current || numero !== requeteRef.current) return
      setData(resultat)
      setError(null)
      setLoading(false)
    } catch (err) {
      if (!monteRef.current || numero !== requeteRef.current) return
      setError(
        err instanceof Error
          ? err
          : new Error('Une erreur inattendue est survenue.')
      )
      setLoading(false)
    }
  }, [])

  const arreter = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const demarrer = useCallback(() => {
    arreter()
    if (typeof document !== 'undefined' && document.hidden) return
    timerRef.current = setInterval(executer, intervalMs)
  }, [arreter, executer, intervalMs])

  useEffect(() => {
    monteRef.current = true
    executer()
    demarrer()

    const surChangementVisibilite = () => {
      if (document.hidden) {
        arreter()
        return
      }
      executer()
      demarrer()
    }

    document.addEventListener('visibilitychange', surChangementVisibilite)

    return () => {
      monteRef.current = false
      document.removeEventListener('visibilitychange', surChangementVisibilite)
      arreter()
    }
  }, [arreter, demarrer, executer])

  return { data, error, loading, refresh: executer }
}
