// ─────────────────────────────────────────────────────────────────────────────
//  hooks/useProviderStatus.js
//  Récupère et met à jour l'état de santé de tous les providers
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'

const STATUS_REFRESH_MS = 30_000  // 30 secondes

export function useProviderStatus() {
  const [providers,     setProviders]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [backendOnline, setBackendOnline] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/providers/status', {
        signal: AbortSignal.timeout(3000),
      })
      if (!res.ok) throw new Error('Backend unavailable')
      const data = await res.json()
      setProviders(data)
      setBackendOnline(true)
    } catch {
      setBackendOnline(false)
      setProviders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, STATUS_REFRESH_MS)
    return () => clearInterval(id)
  }, [fetchStatus])

  // ── Providers actifs (clé configurée) ──────────────────────────────────────
  const enabledProviders  = providers.filter(p => p.is_enabled)
  const healthyProviders  = providers.filter(p => p.is_healthy && p.is_enabled)

  return { providers, enabledProviders, healthyProviders, loading, backendOnline, refresh: fetchStatus }
}
