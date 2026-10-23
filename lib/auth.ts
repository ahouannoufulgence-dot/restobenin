/**
 * Connexion : point d'entrée unique pour l'authentification.
 *
 * MODE DÉMONSTRATION : tant que la base de données n'est pas branchée, aucun compte n'est vérifié.
 * Toute adresse e-mail valide avec un mot de passe d'au moins 6 caractères ouvre une session locale.
 * Ce n'est PAS une protection : à remplacer par la vraie authentification (ex. Supabase Auth)
 * en ne modifiant que `signIn`, `signOut` et `getSession`.
 */
export const DEMO_AUTH = true

const KEY = 'restoben:session'

export type Session = { email: string; at: number }

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
export const MIN_PASSWORD = 6

export type SignInResult = { ok: true } | { ok: false; error: string }

export async function signIn(email: string, password: string, remember: boolean): Promise<SignInResult> {
  if (!isValidEmail(email) || password.length < MIN_PASSWORD) {
    return { ok: false, error: 'Adresse e-mail ou mot de passe incorrect.' }
  }
  const session: Session = { email: email.trim().toLowerCase(), at: Date.now() }
  try {
    // « Se souvenir de moi » : session durable. Sinon, elle s'efface à la fermeture du navigateur.
    const store = remember ? window.localStorage : window.sessionStorage
    ;(remember ? window.sessionStorage : window.localStorage).removeItem(KEY)
    store.setItem(KEY, JSON.stringify(session))
  } catch {
    return { ok: false, error: 'Impossible d’ouvrir la session : le stockage du navigateur est bloqué.' }
  }
  return { ok: true }
}

export function getSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function signOut() {
  try {
    window.localStorage.removeItem(KEY)
    window.sessionStorage.removeItem(KEY)
  } catch {
    /* stockage indisponible */
  }
}
