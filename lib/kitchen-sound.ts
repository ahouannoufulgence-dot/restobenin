/**
 * Son d'alerte de la cuisine.
 *
 * Les navigateurs (surtout sur téléphone) n'autorisent le son qu'après un appui de la personne. On garde donc
 * un seul contexte audio, débloqué par un appui (bouton « Son » ou premier toucher de l'écran), et réutilisé
 * pour chaque alerte.
 */
let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}

/** À appeler pendant un appui : débloque le son. Renvoie true si le son est prêt. */
export async function unlockAudio(): Promise<boolean> {
  try {
    const c = getContext()
    if (!c) return false
    if (c.state === 'suspended') await c.resume()
    return c.state === 'running'
  } catch {
    return false
  }
}

/** Joue « ding-dong » (deux notes) et fait vibrer le téléphone. Renvoie false si le navigateur bloque le son. */
export async function playDing(): Promise<boolean> {
  if (!(await unlockAudio())) return false
  const c = getContext()!
  const t0 = c.currentTime
  for (const [freq, delay] of [[880, 0], [1175, 0.24]] as const) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t0 + delay)
    gain.gain.exponentialRampToValueAtTime(0.5, t0 + delay + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 0.45)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t0 + delay)
    osc.stop(t0 + delay + 0.47)
  }
  try {
    navigator.vibrate?.(250)
  } catch {
    /* vibration indisponible */
  }
  return true
}
