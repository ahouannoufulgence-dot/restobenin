/**
 * Connexion : point d'entrée unique pour l'authentification.
 *
 * MODE DÉMONSTRATION : tant que la base de données n'est pas branchée, aucun mot de passe n'est vérifié.
 * Gérant : toute adresse e-mail ou tout téléphone valide, avec un mot de passe d'au moins 6 caractères,
 * ouvre une session locale. Employé : l'identifiant doit en plus correspondre à un employé actif de la
 * liste du module Employés.
 * Ce n'est PAS une protection : à remplacer par la vraie authentification (ex. Supabase Auth)
 * en ne modifiant que `signIn`, `signOut` et `getSession`.
 */
import { getAccount, matchesAccount } from '@/lib/account-store'
import { findEmployee } from '@/lib/employees-store'

export const DEMO_AUTH = true

const KEY = 'restoben:session'

export type Role = 'gerant' | 'employe'

/** `identifier` : adresse e-mail ou numéro de téléphone saisi à la connexion. */
export type Session = { identifier: string; role: Role; name?: string; at: number }

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
/** Numéro béninois : 8 chiffres (ancien format) ou 10 chiffres (« 01 … »), avec ou sans +229. */
export const isValidPhone = (value: string) => /^(\+?229)?(\d{8}|\d{10})$/.test(value.replace(/[\s.\-()]/g, ''))
export const isValidIdentifier = (value: string) => isValidEmail(value) || isValidPhone(value)
export const MIN_PASSWORD = 6

export type SignInResult = { ok: true } | { ok: false; error: string }

export async function signIn(identifier: string, password: string, remember: boolean, role: Role = 'gerant'): Promise<SignInResult> {
  if (!isValidIdentifier(identifier) || password.length < MIN_PASSWORD) {
    return { ok: false, error: 'Identifiant ou mot de passe incorrect.' }
  }
  let name: string | undefined
  if (role === 'employe') {
    // Démonstration : le compte employé doit exister dans la liste du gérant (module Employés).
    const employee = findEmployee(identifier)
    if (!employee) return { ok: false, error: 'Identifiant ou mot de passe incorrect.' }
    if (employee.status === 'conge') return { ok: false, error: 'Ce compte est en congé. Contactez votre gérant.' }
    name = employee.name
  } else {
    // Si l'identifiant est celui du compte créé à l'inscription, on retrouve le nom du responsable.
    const account = getAccount()
    if (account && matchesAccount(account, identifier)) name = account.manager
  }
  const session: Session = {
    identifier: identifier.includes('@') ? identifier.trim().toLowerCase() : identifier.trim(),
    role,
    name,
    at: Date.now(),
  }
  return openSession(session, remember)
}

/** Enregistre la session. « Se souvenir de moi » : session durable ; sinon elle s'efface à la fermeture du navigateur. */
export function openSession(session: Session, remember: boolean): SignInResult {
  try {
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
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Session> & { email?: string }
    // Anciennes sessions (avant l'onglet Employé) : toujours des gérants, identifiées par `email`.
    return { identifier: parsed.identifier ?? parsed.email ?? '', role: parsed.role === 'employe' ? 'employe' : 'gerant', name: parsed.name, at: parsed.at ?? 0 }
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
