import { useSyncExternalStore } from 'react'
import { restaurant } from './client-data'

/**
 * Paramètres du restaurant, partagés entre l'espace gérant et l'espace client.
 * Comme la carte (menu-store), ils sont gardés dans le navigateur en attendant la base de données.
 */
export type Settings = {
  restaurantName: string
  /** Adresse publique du site, utilisée dans les QR codes. Vide = adresse actuelle du navigateur. */
  siteUrl: string
  /** Informations imprimées en haut du reçu. */
  address: string
  phone: string
  receiptFooter: string
  /** Inclure l'historique fictif de démonstration dans les rapports. */
  demoData: boolean
}

const KEY = 'restoben:settings:v1'
const DEFAULTS: Settings = { restaurantName: restaurant.name, siteUrl: '', address: '', phone: '', receiptFooter: 'Merci de votre visite !', demoData: true }

let cache: Settings | null = null
const listeners = new Set<() => void>()

function read(): Settings {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const p = JSON.parse(raw) as Partial<Settings>
    return {
      restaurantName: typeof p.restaurantName === 'string' && p.restaurantName.trim() ? p.restaurantName : DEFAULTS.restaurantName,
      siteUrl: typeof p.siteUrl === 'string' ? p.siteUrl : '',
      address: typeof p.address === 'string' ? p.address : '',
      phone: typeof p.phone === 'string' ? p.phone : '',
      receiptFooter: typeof p.receiptFooter === 'string' ? p.receiptFooter : DEFAULTS.receiptFooter,
      demoData: typeof p.demoData === 'boolean' ? p.demoData : true,
    }
  } catch {
    return DEFAULTS
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function onStorage(e: StorageEvent) {
  if (e.key === KEY || e.key === null) {
    cache = null
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

const getSnapshot = () => (cache ??= read())
const getServerSnapshot = () => DEFAULTS

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Enregistre les paramètres. Renvoie false si le navigateur n'a plus de place. */
export function saveSettings(next: Settings): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    return false
  }
  cache = next
  emit()
  return true
}

/** Transforme « monsite.com/ » en « https://monsite.com ». Renvoie '' si l'adresse est vide ou invalide. */
export function normalizeSiteUrl(input: string): string {
  const value = input.trim()
  if (!value) return ''
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withProtocol)
    return url.origin
  } catch {
    return ''
  }
}

export function tableNumber(tableId: string): string {
  return tableId.replace(/\D/g, '') || tableId
}

export function tableUrl(baseUrl: string, tableId: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/client?table=${encodeURIComponent(tableNumber(tableId))}`
}
