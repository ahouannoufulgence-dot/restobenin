import { useMemo, useSyncExternalStore } from 'react'
import { catalog, type Category, type ClientDish } from './client-data'
import { api, publicUrl, uploadDataUrl } from './supabase/api'
import { getSupabase } from './supabase/client'
import { background, getRemote, onRemoteReset } from './supabase/runtime'

/**
 * Carte du restaurant partagée entre l'espace gérant (/gerant) et l'espace client (/client).
 *
 * Pour l'instant les données sont gardées dans le navigateur (localStorage) : le gérant et le client
 * voient la même carte sur le même appareil, et en direct entre deux onglets. Pour partager la carte
 * entre plusieurs appareils, il suffira de remplacer `read` et `commit` par des appels à la base de
 * données : le reste de l'application ne change pas.
 */

/** Une taille d'un plat (petit, grand…) avec son prix. Un plat sans taille utilise son prix de base. */
export type MenuVariant = { id: string; name: string; price: number; available: boolean; image?: string }

export type MenuDish = {
  id: string
  name: string
  description: string
  price: number
  category: Category
  image?: string
  available: boolean
  /** Tailles du plat, dans l'ordre d'affichage (vide si le plat n'en a pas). */
  variants?: MenuVariant[]
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

// Les photos d'origine sont passées de .png à .webp (bien plus légères) : on corrige les menus déjà enregistrés.
function migrateImage(d: MenuDish): MenuDish {
  const m = d.image?.match(/^(\/images\/gerant\/[a-z-]+)\.png$/)
  return m ? { ...d, image: `${m[1]}.webp` } : d
}

function read(): MenuDish[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return SEED
    const parsed: unknown = JSON.parse(raw)
    return isMenu(parsed) ? parsed.map(migrateImage) : SEED
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

// Mode base de données : la carte vient de Supabase (jamais du navigateur) et est vidée à la déconnexion.
onRemoteReset(() => {
  cache = null
  emit()
})

/** Met en place la carte lue dans la base. Un restaurant neuf démarre avec une carte vide. */
export function applyRemoteMenu(list: MenuDish[]) {
  cache = list
  emit()
}

const remoteCommit = (next: MenuDish[]) => {
  cache = next
  emit()
  return true
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

/**
 * Enregistre les tailles d'un plat : ajoute les nouvelles, met à jour les modifiées, retire celles qui ont disparu.
 * Un plat sans taille n'a aucune ligne. La base refuse une taille qui ne correspond pas au plat (contrôle dans la base).
 */
async function syncVariants(restaurantId: string, dish: MenuDish, existed: boolean) {
  // Photo choisie sur cet appareil : envoyée dans le stockage ; la base ne garde que son chemin.
  const wanted = await Promise.all((dish.variants ?? []).map(async (v) => {
    if (v.image?.startsWith('data:')) {
      const path = await uploadDataUrl(restaurantId, 'variantes', v.id, v.image)
      return { ...v, image: publicUrl(path), imagePath: path as string | null }
    }
    return { ...v, imagePath: v.image ? undefined : null }
  }))
  if (!existed && wanted.length === 0) return
  const { data, error } = await getSupabase().from('menu_variants').select('id').eq('menu_item_id', dish.id)
  if (error) throw new Error(error.message)
  const current = new Set(((data ?? []) as { id: string }[]).map((r) => r.id))
  const keep = new Set(wanted.filter((v) => current.has(v.id)).map((v) => v.id))

  for (const id of current) {
    if (!keep.has(id)) {
      const removed = await api.deleteVariant(id)
      if (removed.error) throw new Error(removed.error.message)
    }
  }
  for (const [position, v] of wanted.entries()) {
    const row: Record<string, unknown> = { name: v.name, price_fcfa: v.price, position, available: v.available }
    if (v.imagePath !== undefined) row.image_path = v.imagePath
    if (current.has(v.id)) {
      const updated = await api.updateVariant(v.id, row)
      if (updated.error) throw new Error(updated.error.message)
    } else {
      const inserted = await api.insertVariant({ id: v.id, restaurant_id: restaurantId, menu_item_id: dish.id, ...row })
      if (inserted.error) throw new Error(inserted.error.message)
    }
  }
}

export const menuActions = {
  toggle(id: string) {
    const list = getSnapshot()
    const dish = list.find((d) => d.id === id)
    const next = list.map((d) => (d.id === id ? { ...d, available: !d.available } : d))
    if (!getRemote() || !dish) return commit(next)
    remoteCommit(next)
    background('Mise à jour du plat', () => api.updateDish(id, { available: !dish.available }))
    return true
  },
  /** Ajoute le plat, ou met à jour celui qui a le même id. */
  save(dish: MenuDish) {
    const list = getSnapshot()
    const exists = list.some((d) => d.id === dish.id)
    const next = exists ? list.map((d) => (d.id === dish.id ? dish : d)) : [...list, dish]
    const remote = getRemote()
    if (!remote) return commit(next)
    remoteCommit(next)
    background(exists ? 'Modification du plat' : 'Ajout du plat', async () => {
      // Photo choisie sur cet appareil : envoyée dans le stockage, la base ne garde que son chemin.
      let imagePath: string | null | undefined
      if (dish.image?.startsWith('data:')) {
        imagePath = await uploadDataUrl(remote.restaurantId, 'menu', dish.id, dish.image)
        const url = publicUrl(imagePath)
        remoteCommit(getSnapshot().map((d) => (d.id === dish.id ? { ...d, image: url } : d)))
      } else if (!dish.image) imagePath = null
      const row: Record<string, unknown> = {
        name: dish.name,
        description: dish.description,
        price_fcfa: dish.price,
        category: dish.category,
        available: dish.available,
        ...(imagePath !== undefined ? { image_path: imagePath } : {}),
      }
      const saved = exists ? await api.updateDish(dish.id, row) : await api.insertDish({ id: dish.id, restaurant_id: remote.restaurantId, position: list.length, ...row })
      if (saved.error) return saved
      await syncVariants(remote.restaurantId, dish, exists)
      return saved
    })
    return true
  },
  remove(id: string) {
    const next = getSnapshot().filter((d) => d.id !== id)
    if (!getRemote()) return commit(next)
    remoteCommit(next)
    background('Suppression du plat', () => api.deleteDish(id))
    return true
  },
  newId() {
    // Mode base de données : un vrai identifiant unique (la base en exige un).
    return getRemote() ? crypto.randomUUID() : `d-${Date.now().toString(36)}`
  },
}
