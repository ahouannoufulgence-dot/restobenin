/**
 * Connexion Super Admin.
 *
 *  - Base de données (Supabase configuré) : vraie authentification par e-mail et mot de passe (Supabase Auth).
 *    Le compte doit aussi figurer dans la table `platform_admins` (fonction `is_platform_admin()`), sinon l'accès
 *    est refusé. Les données sont protégées côté serveur par les règles d'accès (RLS) : un contrôle fait
 *    uniquement dans le navigateur ne protège rien, ici il ne sert qu'à choisir l'écran à afficher.
 *  - Démonstration (variables Supabase absentes) : AUCUNE PROTECTION. N'importe quel identifiant (3 caractères
 *    minimum) avec un mot de passe de 8 caractères minimum ouvre une session locale, et l'espace n'affiche que
 *    des données fictives.
 */
import { getSupabase, supabaseConfigured } from '@/lib/supabase/client'
import { friendlyError } from '@/lib/supabase/runtime'

/** Vrai en mode démonstration (pas de base de données branchée). */
export const DEMO_SUPERADMIN = !supabaseConfigured

const KEY = 'restoben:superadmin:session'

export type SuperAdminSession = { identifier: string; at: number }

export type SuperAdminSignIn = { ok: true } | { ok: false; error: string }

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

export async function signInSuperAdmin(identifier: string, password: string, remember: boolean): Promise<SuperAdminSignIn> {
  if (supabaseConfigured) return remoteSignIn(identifier, password)
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

async function remoteSignIn(identifier: string, password: string): Promise<SuperAdminSignIn> {
  if (!isEmail(identifier)) return { ok: false, error: 'Saisissez votre adresse e-mail.' }
  const sb = getSupabase()
  try {
    const { error } = await sb.auth.signInWithPassword({ email: identifier.trim().toLowerCase(), password })
    if (error) return { ok: false, error: 'Identifiant ou mot de passe incorrect.' }
    const { data, error: rpcError } = await sb.rpc('is_platform_admin')
    if (rpcError) {
      await sb.auth.signOut()
      return { ok: false, error: friendlyError(rpcError.message) }
    }
    if (data !== true) {
      await sb.auth.signOut()
      return { ok: false, error: 'Accès réservé aux administrateurs de la plateforme.' }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: friendlyError(e instanceof Error ? e.message : String(e)) }
  }
}

/** Session en cours (ou null). En mode base de données, vérifie aussi le rôle super admin. */
export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  if (supabaseConfigured) {
    try {
      const sb = getSupabase()
      const { data } = await sb.auth.getSession()
      const email = data.session?.user.email
      if (!email) return null
      const { data: isAdmin } = await sb.rpc('is_platform_admin')
      return isAdmin === true ? { identifier: email, at: Date.now() } : null
    } catch {
      return null
    }
  }
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SuperAdminSession) : null
  } catch {
    return null
  }
}

export function signOutSuperAdmin() {
  if (supabaseConfigured) void getSupabase().auth.signOut()
  try {
    window.localStorage.removeItem(KEY)
    window.sessionStorage.removeItem(KEY)
  } catch {
    /* stockage indisponible */
  }
}
