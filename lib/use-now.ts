import { useEffect, useState } from 'react'

/** Heure actuelle, rafraîchie à intervalle régulier (pour les minutres d'attente). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}
