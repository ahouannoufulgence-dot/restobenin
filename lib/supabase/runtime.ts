import { useSyncExternalStore } from 'react'

/**
 * État d'exécution du mode « base de données » (Supabase) : restaurant connecté, chargement, erreurs.
 * Aucun import des stores ici : les stores s'appuient sur ce fichier, pas l'inverse.
 */
export type RemoteContext = { restaurantId: string; userId: string; staffId: string }
export type Hydration = 'idle' | 'loading' | 'ready' | 'error'
/** État de l'abonnement du restaurant connecté : seul « actif » permet de travailler (sinon lecture seule). */
export type AccountStatus = 'actif' | 'suspendu' | 'resilie'

let ctx: RemoteContext | null = null
let hydration: Hydration = 'idle'
let syncError: string | null = null
let accountStatus: AccountStatus | null = null
let rehydrator: (() => Promise<boolean>) | null = null
const resetters = new Set<() => void>()
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export const getRemote = () => ctx
export const isRemote = () => ctx !== null

export function setRemote(next: RemoteContext | null) {
  ctx = next
  emit()
}

export function setHydration(next: Hydration) {
  hydration = next
  emit()
}

export const useHydration = () => useSyncExternalStore(subscribe, () => hydration, () => 'idle' as Hydration)
export const useAccountStatus = () => useSyncExternalStore(subscribe, () => accountStatus, () => null)
export const getAccountStatus = () => accountStatus
export function setAccountStatus(next: AccountStatus | null) {
  if (accountStatus === next) return
  accountStatus = next
  emit()
}
export const useSyncError = () => useSyncExternalStore(subscribe, () => syncError, () => null)

export function reportSyncError(message: string) {
  syncError = message
  emit()
}
export function clearSyncError() {
  syncError = null
  emit()
}

/** Les stores s'y inscrivent pour vider leur cache quand on quitte le mode base de données (déconnexion). */
export function onRemoteReset(fn: () => void) {
  resetters.add(fn)
}
export function resetRemote() {
  ctx = null
  hydration = 'idle'
  syncError = null
  accountStatus = null
  resetters.forEach((fn) => fn())
  emit()
}

export function setRehydrator(fn: () => Promise<boolean>) {
  rehydrator = fn
}
export const rehydrate = () => (rehydrator ? rehydrator() : Promise.resolve(false))

/** Traduit les messages techniques de la base en phrases claires. Les messages de nos fonctions sont déjà en français. */
export function friendlyError(message: string | undefined | null): string {
  const m = message ?? ''
  if (/row-level security|permission denied|42501/i.test(m) && !/[à-ÿ]/i.test(m)) return 'Action non autorisée pour votre fonction.'
  if (/duplicate key|unique constraint/i.test(m)) return 'Cette valeur est déjà utilisée (adresse e-mail, téléphone ou nom).'
  if (/violates check constraint|invalid input/i.test(m)) return 'Une valeur saisie est invalide.'
  if (/failed to fetch|networkerror|load failed/i.test(m)) return 'Connexion impossible. Vérifiez votre accès Internet.'
  if (/jwt|not authenticated|session/i.test(m) && !/[à-ÿ]/i.test(m)) return 'Votre session a expiré. Reconnectez-vous.'
  return m || 'Une erreur est survenue.'
}

type Outcome = { error: { message: string } | null } | void

/**
 * Enregistre en arrière-plan : l'écran est déjà à jour (affichage immédiat). En cas d'échec, on affiche l'erreur
 * et on recharge l'état réel depuis la base, ce qui annule le changement affiché.
 */
export function background(label: string, task: () => PromiseLike<Outcome>) {
  void Promise.resolve(task())
    .then((res) => {
      if (res && res.error) throw new Error(res.error.message)
    })
    .catch((e: unknown) => {
      reportSyncError(`${label} : ${friendlyError(e instanceof Error ? e.message : String(e))}`)
      void rehydrate()
    })
}
