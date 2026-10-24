import { useSyncExternalStore } from 'react'
import type { Billing, PlanId } from './plans'

/**
 * Compte du restaurant : les informations saisies à l'inscription (nom, responsable, coordonnées,
 * type d'établissement, formule, facturation, mode de paiement).
 *
 * Elles sont gardées dans le navigateur en attendant la base de données, et alimentent les autres
 * modules (tableau de bord, paramètres, employés, abonnement, reçus, espace client…).
 * Le mot de passe n'est JAMAIS conservé ici : il relève de l'authentification réelle (voir `lib/auth.ts`).
 */
export type Account = {
  restaurant: string
  manager: string
  email: string
  /** Numéro mis en forme, ex. « +229 01 97 12 34 56 ». */
  phone: string
  establishment: string
  planId: PlanId
  billing: Billing
  /** Mode de paiement choisi (libellé lisible), ex. « MTN Mobile Money ». */
  paymentMethod: string
  createdAt: number
}

const KEY = 'restoben:account:v1'

let cache: Account | null | undefined
const listeners = new Set<() => void>()

/** Met un numéro béninois en forme : 8 ou 10 chiffres → « +229 01 97 12 34 56 ». */
export function formatPhoneBJ(value: string) {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('229') && digits.length > 10) digits = digits.slice(3)
  if (digits.length !== 8 && digits.length !== 10) return value.trim()
  return `+229 ${digits.match(/\d{2}/g)!.join(' ')}`
}

export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? fullName

function isAccount(value: unknown): value is Account {
  const v = value as Account | null
  return (
    !!v &&
    typeof v.restaurant === 'string' &&
    typeof v.manager === 'string' &&
    typeof v.email === 'string' &&
    typeof v.phone === 'string' &&
    typeof v.establishment === 'string' &&
    (v.billing === 'mensuel' || v.billing === 'annuel') &&
    ['basique', 'standard', 'premium'].includes(v.planId)
  )
}

function read(): Account | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isAccount(parsed) ? parsed : null
  } catch {
    return null
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function onStorage(e: StorageEvent) {
  if (e.key === KEY || e.key === null) {
    cache = undefined
    emit()
  }
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

/** Compte enregistré, ou null tant que personne ne s'est inscrit (mode démonstration). */
export function getAccount(): Account | null {
  if (cache === undefined) cache = read()
  return cache
}

export function useAccount(): Account | null {
  return useSyncExternalStore(subscribe, getAccount, () => null)
}

/** Enregistre le compte. Renvoie false si le navigateur n'a plus de place. */
export function saveAccount(account: Account): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(account))
  } catch {
    return false
  }
  cache = account
  emit()
  return true
}

/** Vrai si l'identifiant (e-mail ou téléphone) est celui du compte. */
export function matchesAccount(account: Account, identifier: string) {
  const value = identifier.trim()
  if (value.includes('@')) return value.toLowerCase() === account.email.trim().toLowerCase()
  const key = value.replace(/\D/g, '').slice(-8)
  return key.length === 8 && key === account.phone.replace(/\D/g, '').slice(-8)
}
