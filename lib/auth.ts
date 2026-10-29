/**
 * Connexion : point d'entrée unique pour l'authentification.
 *
 * Deux modes, selon la configuration :
 *  - Base de données (Supabase configuré) : vraie authentification par e-mail et mot de passe. Le gérant et les
 *    employés se connectent avec leur compte ; les droits viennent de la base (règles d'accès côté serveur).
 *  - Démonstration (variables Supabase absentes) : aucun mot de passe n'est vérifié. Gérant : toute adresse e-mail
 *    ou tout téléphone valide, avec 6 caractères minimum, ouvre une session locale. Employé : l'identifiant doit
 *    correspondre à un employé actif du module Employés. Ce n'est PAS une protection.
 */
import { getAccount, matchesAccount } from '@/lib/account-store'
import { findEmployee } from '@/lib/employees-store'
import { getSupabase, supabaseConfigured } from '@/lib/supabase/client'
import { hydrate } from '@/lib/supabase/hydrate'
import { friendlyError, resetRemote, setRemote } from '@/lib/supabase/runtime'

/** Vrai en mode démonstration (pas de base de données branchée). */
export const DEMO_AUTH = !supabaseConfigured

const KEY = 'restoben:session'

export type Role = 'gerant' | 'employe'

/** `identifier` : adresse e-mail ou numéro de téléphone saisi à la connexion. */
export type Session = { identifier: string; role: Role; name?: string; at: number; restaurantId?: string; staffId?: string }

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
/** Numéro béninois : 8 chiffres (ancien format) ou 10 chiffres (« 01 … »), avec ou sans +229. */
export const isValidPhone = (value: string) => /^(\+?229)?(\d{8}|\d{10})$/.test(value.replace(/[\s.\-()]/g, ''))
export const isValidIdentifier = (value: string) => isValidEmail(value) || isValidPhone(value)
export const MIN_PASSWORD = 6

export type SignInResult = { ok: true } | { ok: false; error: string }

export async function signIn(identifier: string, password: string, remember: boolean, role: Role = 'gerant'): Promise<SignInResult> {
  if (supabaseConfigured) return remoteSignIn(identifier, password, remember, role)
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
    return {
      identifier: parsed.identifier ?? parsed.email ?? '',
      role: parsed.role === 'employe' ? 'employe' : 'gerant',
      name: parsed.name,
      at: parsed.at ?? 0,
      restaurantId: parsed.restaurantId,
      staffId: parsed.staffId,
    }
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
  if (supabaseConfigured) {
    resetRemote() // vide les données du restaurant en mémoire
    void getSupabase().auth.signOut()
  }
}

// ---------- Mode base de données (Supabase) ----------

const WRONG = 'Identifiant ou mot de passe incorrect.'
const NOT_CONFIRMED = 'Confirmez d’abord votre adresse e-mail grâce au lien reçu, puis reconnectez-vous.'

function authMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) return WRONG
  if (/email not confirmed/i.test(message)) return NOT_CONFIRMED
  if (/rate limit|too many/i.test(message)) return 'Trop de tentatives. Patientez quelques minutes.'
  if (/password.*(short|least|weak)/i.test(message)) return 'Le mot de passe est trop court ou trop faible.'
  return friendlyError(message)
}

async function remoteSignIn(identifier: string, password: string, remember: boolean, role: Role): Promise<SignInResult> {
  if (!isValidEmail(identifier)) {
    return { ok: false, error: 'Connectez-vous avec votre adresse e-mail (la connexion par téléphone arrive bientôt).' }
  }
  if (!password) return { ok: false, error: WRONG }
  const sb = getSupabase()
  const email = identifier.trim().toLowerCase()
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { ok: false, error: authMessage(error?.message ?? '') }

  // Rattache le compte à sa fiche employé (e-mail confirmé) puis cherche le restaurant de la personne.
  await sb.rpc('claim_staff')
  const { data: rows, error: staffError } = await sb.from('staff').select('id, restaurant_id, name, role, status').eq('user_id', data.user.id)
  if (staffError) {
    await sb.auth.signOut()
    return { ok: false, error: friendlyError(staffError.message) }
  }
  const list = (rows ?? []) as { id: string; restaurant_id: string; name: string; role: string; status: string }[]
  const active = list.filter((r) => r.status === 'actif')
  if (list.length === 0) {
    await sb.auth.signOut()
    return { ok: false, error: 'Aucun restaurant n’est associé à ce compte. Terminez votre inscription ou demandez à votre gérant d’ajouter votre adresse e-mail.' }
  }
  if (active.length === 0) {
    await sb.auth.signOut()
    return { ok: false, error: 'Ce compte est en congé. Contactez votre gérant.' }
  }
  const me = active.find((r) => (role === 'gerant') === (r.role === 'gerant')) ?? null
  if (!me) {
    await sb.auth.signOut()
    return { ok: false, error: role === 'gerant' ? 'Ce compte n’est pas un compte gérant. Utilisez l’onglet « Employé ».' : 'Ce compte est un compte gérant. Utilisez l’onglet « Gérant ».' }
  }

  setRemote({ restaurantId: me.restaurant_id, userId: data.user.id, staffId: me.id })
  if (!(await hydrate())) {
    resetRemote()
    await sb.auth.signOut()
    return { ok: false, error: 'Impossible de charger les données du restaurant. Réessayez.' }
  }
  return openSession({ identifier: email, role, name: me.name, at: Date.now(), restaurantId: me.restaurant_id, staffId: me.id }, remember)
}

/**
 * Rouvre la session après un rechargement de la page : vérifie le compte auprès de Supabase puis recharge les données.
 * Renvoie false si la session a expiré (il faut alors se reconnecter).
 */
export async function restoreRemoteSession(): Promise<boolean> {
  const session = getSession()
  if (!supabaseConfigured || !session?.restaurantId || !session.staffId) return false
  const { data } = await getSupabase().auth.getSession()
  if (!data.session) return false
  setRemote({ restaurantId: session.restaurantId, userId: data.session.user.id, staffId: session.staffId })
  return hydrate()
}

export type SignUpResult = { ok: true; verified: boolean } | { ok: false; error: string }

/**
 * Crée le compte de connexion (e-mail + mot de passe). Si le compte existe déjà avec ce mot de passe (inscription
 * interrompue), on le reprend. `verified` : l'e-mail est déjà confirmé, on peut continuer sans attendre le lien.
 */
export async function signUpAccount(email: string, password: string, fullName: string): Promise<SignUpResult> {
  const sb = getSupabase()
  const address = email.trim().toLowerCase()
  const redirect = `${window.location.origin}/connexion`
  const attempt = await sb.auth.signInWithPassword({ email: address, password })
  if (!attempt.error) return { ok: true, verified: true }
  if (/email not confirmed/i.test(attempt.error.message)) {
    await sb.auth.resend({ type: 'signup', email: address, options: { emailRedirectTo: redirect } })
    return { ok: true, verified: false }
  }
  const { data, error } = await sb.auth.signUp({ email: address, password, options: { data: { full_name: fullName }, emailRedirectTo: redirect } })
  if (error) return { ok: false, error: authMessage(error.message) }
  if (data.user && data.user.identities?.length === 0) {
    return { ok: false, error: 'Cette adresse e-mail est déjà utilisée. Connectez-vous, ou utilisez le mot de passe de votre compte.' }
  }
  return { ok: true, verified: !!data.session }
}

/** Vérifie que l'e-mail est confirmé : la connexion ne réussit qu'après le clic sur le lien reçu. */
export async function checkEmailConfirmed(email: string, password: string): Promise<string | null> {
  const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  return error ? authMessage(error.message) : null
}

export async function resendConfirmation(email: string): Promise<string | null> {
  const { error } = await getSupabase().auth.resend({ type: 'signup', email: email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/connexion` } })
  return error ? authMessage(error.message) : null
}

/** Première connexion d'un employé : crée son accès avec l'adresse e-mail que le gérant a enregistrée pour lui. */
export async function activateEmployee(email: string, password: string): Promise<SignInResult> {
  if (!isValidEmail(email)) return { ok: false, error: 'Saisissez l’adresse e-mail enregistrée par votre gérant.' }
  const { data, error } = await getSupabase().auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: `${window.location.origin}/connexion` },
  })
  if (error) return { ok: false, error: authMessage(error.message) }
  if (data.user && data.user.identities?.length === 0) {
    return { ok: false, error: 'Un accès existe déjà pour cette adresse. Connectez-vous avec votre mot de passe.' }
  }
  return { ok: true }
}
