import { useMemo, useSyncExternalStore } from 'react'
import { catalog, type Category, type ClientDish } from './client-data'

/**
 * Carte du restaurant partagée entre l'espace gérant (/gerant) et l'espace client (/client).
 *
 * Pour l'instant les données sont gardées dans le navigateur (localStorage) : le gérant et le client
 * voient la même carte sur le même appareil, et en direct entre deux onglets. Pour partager la carte
 * entre plusieurs appareils, il suffira de remplacer `read` et `commit` par des appels à la base de
 * données : le reste de l'application ne change pas.
 */

export type MenuDish = {
  id: string
  name: string
  description: string
  price: number
  category: Category
  image?: string
  available: boolean
}

const KEY = 'restoben:menu:v1'

const SEED: MenuDish[] = catalog.map(({ id, name, description, price, category, image, available }) => ({
  id,
  name,
  description,
  price,
  category,
  image,
  available,
}))

let cache: MenuDish[] | null = null
const listeners = new Set<() => void>()

function isMenu(value: unknown): value is MenuDish[] {
  return (
    Array.isArray(value) &&
    value.every((d) => d && typeof d.id === 'string' && typeof d.name === 'string' && typeof d.price === 'number' && typeof d.available === 'boolean')
  )
}

function read(): MenuDish[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return SEED
    const parsed: unknown = JSON.parse(raw)
    return isMenu(parsed) ? parsed : SEED
  } catch {
    return SEED
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

function getSnapshot() {
  if (!cache) cache = read()
  return cache
}

function getServerSnapshot() {
  return SEED
}

/** Enregistre la nouvelle carte. Renvoie false si le navigateur n'a plus de place. */
function commit(next: MenuDish[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    return false
  }
  cache = next
  emit()
  return true
}

export function useMenu(): MenuDish[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** La carte vue par le client : avis et notes des plats d'origine, « nouveau » pour les plats ajoutés. */
export function useClientDishes(): ClientDish[] {
  const menu = useMenu()
  return useMemo(
    () =>
      menu.map((m) => {
        const base = catalog.find((c) => c.id === m.id)
        return { ...m, rating: base?.rating ?? 0, reviewCount: base?.reviewCount ?? 0, reviews: base?.reviews ?? [] }
      }),
    [menu],
  )
}

export const menuActions = {
  toggle(id: string) {
    return commit(getSnapshot().map((d) => (d.id === id ? { ...d, available: !d.available } : d)))
  },
  /** Ajoute le plat, ou met à jour celui qui a le même id. */
  save(dish: MenuDish) {
    const list = getSnapshot()
    const exists = list.some((d) => d.id === dish.id)
    return commit(exists ? list.map((d) => (d.id === dish.id ? dish : d)) : [...list, dish])
  },
  remove(id: string) {
    return commit(getSnapshot().filter((d) => d.id !== id))
  },
  newId() {
    return `d-${Date.now().toString(36)}`
  },
}
