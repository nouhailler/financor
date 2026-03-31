// ─────────────────────────────────────────────────────────────────────────────
//  hooks/useStockData.js
//  Fetching d'une cotation avec auto-refresh, gestion erreur et fraîcheur
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react'

const REFRESH_INTERVAL_MS = 60_000  // 60 secondes

/**
 * @param {string}  symbol           Ticker ex: "AAPL"
 * @param {string}  preferredProvider  "auto" | "finnhub" | "twelve_data" | "fmp" | ...
 * @param {boolean} enabled          Permet de suspendre le polling
 */
export function useStockData(symbol, preferredProvider = 'auto', enabled = true) {
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const abortRef = useRef(null)

  const fetchQuote = useCallback(async () => {
    if (!symbol || !enabled) return

    // Annule la requête précédente si toujours en cours
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (preferredProvider && preferredProvider !== 'auto') {
        params.set('provider', preferredProvider)
      }

      const res = await fetch(`/api/quote/${symbol}?${params}`, {
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `HTTP ${res.status}`)
      }

      const result = await res.json()
      setData(result)
      setLastUpdated(new Date(result.timestamp))
    } catch (err) {
      if (err.name === 'AbortError') return  // Requête annulée volontairement
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [symbol, preferredProvider, enabled])

  // Chargement initial + polling
  useEffect(() => {
    fetchQuote()
    const id = setInterval(fetchQuote, REFRESH_INTERVAL_MS)
    return () => {
      clearInterval(id)
      abortRef.current?.abort()
    }
  }, [fetchQuote])

  // ── Calcul de la fraîcheur ─────────────────────────────────────────────────
  const freshness = computeFreshness(lastUpdated, data?.is_delayed, data?.delay_minutes)

  return { data, loading, error, lastUpdated, freshness, refresh: fetchQuote }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Retourne un objet { label, color, dot } décrivant la fraîcheur de la donnée.
 */
export function computeFreshness(lastUpdated, isDelayed, delayMinutes = 0) {
  if (!lastUpdated) return { label: '—', color: 'text-stone-500', dot: 'bg-stone-600', level: 'unknown' }

  const ageMin = (Date.now() - new Date(lastUpdated).getTime()) / 60_000

  if (ageMin < 5) {
    return { label: 'À jour',               color: 'text-emerald-500', dot: 'bg-emerald-500', level: 'fresh' }
  }
  if (ageMin < 20 || (isDelayed && delayMinutes <= 20)) {
    return { label: `${Math.round(ageMin)} min`, color: 'text-amber-400',  dot: 'bg-amber-400',  level: 'delayed' }
  }
  return   { label: `${Math.round(ageMin)} min`, color: 'text-red-500',    dot: 'bg-red-500',    level: 'stale' }
}
