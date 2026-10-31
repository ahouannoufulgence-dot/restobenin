import { useSyncExternalStore } from 'react'
import { initialTables, type RestaurantTable, type TableStatus } from './gerant-data'
import { api } from './supabase/api'
import { background, getRemote, onRemoteReset } from './supabase/runtime'

/**
 * Tables du restaurant. Mode base de données : lues dans Supabase (table `dining_tables`), une liste par restaurant.
 * Démonstration : liste de départ gardée en mémoire (perdue au rechargement).
 * L'identifiant d'une table est « T » suivi de son numéro (T1, T2…).
 */
const nextStatus: Record<TableStatus, TableStatus> = { libre: 'occupee', occupee: 'reservee', reservee: 'libre' }

let cache: RestaurantTable[] = initialTables
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

const numberOf = (id: string) => Number(id.replace(/\D/g, '')) || 0

export const useTables = () => useSyncExternalStore(subscribe, () => cache, () => initialTables)

onRemoteReset(() => {
  cache = initialTables
  emit()
})

/** Met en place les tables lues dans la base. */
export function applyRemoteTables(rows: { number: number; seats: number; status: TableStatus }[]) {
  cache = [...rows].sort((a, b) => a.number - b.number).map((r) => ({ id: `T${r.number}`, seats: r.seats, status: r.status }))
  emit()
}

export const tablesActions = {
  cycle(id: string) {
    const table = cache.find((t) => t.id === id)
    if (!table) return
    const status = nextStatus[table.status]
    cache = cache.map((t) => (t.id === id ? { ...t, status } : t))
    emit()
    const remote = getRemote()
    if (remote) background('Mise à jour de la table', () => api.updateTableStatus(remote.restaurantId, numberOf(id), status))
  },
  add() {
    const number = Math.max(0, ...cache.map((t) => numberOf(t.id))) + 1
    const table: RestaurantTable = { id: `T${number}`, seats: 4, status: 'libre' }
    cache = [...cache, table]
    emit()
    const remote = getRemote()
    if (remote) background('Ajout de la table', () => api.insertTable({ restaurant_id: remote.restaurantId, number, seats: 4, status: 'libre' }))
  },
}
