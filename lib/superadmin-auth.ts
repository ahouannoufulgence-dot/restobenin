/**
 * Connexion Super Admin.
 *
 * MAQUETTE — AUCUNE PROTECTION RÉELLE. Tant que la base de données n'est pas branchée, n'importe quel
 * identifiant (3 caractères minimum) avec un mot de passe de 8 caractères minimum ouvre une session locale
 * dans le navigateur. L'espace n'affiche que des données fictives.
 *
 * AVANT d'y mettre de vraies données : remplacer `signInSuperAdmin`, `getSuperAdminSession` et
 * `signOutSuperAdmin` par une vraie authentification (ex. Supabase Auth, rôle « super_admin » stocké en base
 * et vérifié côté serveur, double authentification). Un contrôle fait uniquement dans le navigateur ne
 * protège rien.
 */
export const DEMO_SUPERADMIN = true

const KEY = 'restoben:superadmin:session'

export type SuperAdminSession = { identifier: string; at: number }

export type SuperAdminSignIn = { ok: true } | { ok: false; error: string }

export async function signInSuperAdmin(identifier: string, password: string, remember: boolean): Promise<SuperAdminSignIn> {
  if (identifier.trim().length < 3 || password.length < 8) return { ok: false, error: 'Identifiant ou mot de passe incorrect.' }
  const session: SuperAdminSession = { identifier: identifier.trim(), at: Date.now() }
  try {
    const store = remember ? window.localStorage : window.sessionStorage
    ;(remember ? window.sessionStorage : window.localStorage).removeItem(KEY)
    store.setItem(KEY, JSON.stringify(session))
  } catch {
    return { ok: false, error: 'Impossible d’ouvrir la session : le stockage du navigateur est bloqué.' }
  }
  return { ok: true }
}

export function getSuperAdminSession(): SuperAdminSession | null {
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SuperAdminSession) : null
  } catch {
    return null
  }
}

export function signOutSuperAdmin() {
  try {
    window.localStorage.removeItem(KEY)
    window.sessionStorage.removeItem(KEY)
  } catch {
    /* stockage indisponible */
  }
}
