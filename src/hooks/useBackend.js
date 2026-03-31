// ─────────────────────────────────────────────────────────────────────────────
//  hooks/useBackend.js
//  Détecte si le backend Python est disponible (ping /api/health)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'

export function useBackend() {
  const [online,  setOnline]  = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(2000) })
        if (mounted) setOnline(res.ok)
      } catch {
        if (mounted) setOnline(false)
      } finally {
        if (mounted) setChecked(true)
      }
    }
    check()
    const id = setInterval(check, 30_000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  return { online, checked }
}
