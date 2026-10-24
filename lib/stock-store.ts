import { useSyncExternalStore } from 'react'

/**
 * Stocks du restaurant (module « Stocks » de l'espace gérant).
 *
 * Comme le menu, les commandes et les employés, les articles et leurs mouvements sont gardés dans le
 * navigateur (localStorage) en attendant la base de données. Pour passer à Supabase, il suffira de
 * remplacer `read` et `commit` par des appels à la base.
 */

export type StockUnit = 'kg' | 'L' | 'pièce' | 'sac'
export type StockKind = 'legume' | 'tubercule' | 'cereale' | 'huile' | 'viande' | 'poisson' | 'boisson' | 'epice'
export type StockLevel = 'ok' | 'faible' | 'critique'
export type MovementType = 'entree' | 'sortie'

export type StockItem = {
  id: string
  name: string
  unit: StockUnit
  qty: number
  /** Seuil d'alerte : en dessous, l'article est « Stock faible ». */
  threshold: number
  /** Prix d'achat par unité (FCFA), pour la valeur totale du stock. */
  unitCost: number
  /** Variation (en %) provoquée par le dernier mouvement. */
  trend: number
  kind: StockKind
  /** Photo facultative (data URL ou chemin) ; sinon une icône est affichée. */
  image?: string
}

export type StockMovement = {
  id: string
  itemId: string
  /** Nom de l'article au moment du mouvement (reste lisible si l'article est supprimé). */
  itemName: string
  unit: StockUnit
  type: MovementType
  qty: number
  note?: string
  at: number
}

type State = { items: StockItem[]; movements: StockMovement[] }

export const units: StockUnit[] = ['kg', 'L', 'pièce', 'sac']

export const kindLabels: Record<StockKind, string> = {
  legume: 'Légumes',
  tubercule: 'Tubercules',
  cereale: 'Céréales',
  huile: 'Huiles',
  viande: 'Viandes',
  poisson: 'Poissons',
  boisson: 'Boissons',
  epice: 'Épices',
}

/** Sous 60 % du seuil, l'article est critique ; sous le seuil, il est faible. */
export function levelOf(item: Pick<StockItem, 'qty' | 'threshold'>): StockLevel {
  if (item.qty >= item.threshold) return 'ok'
  return item.qty >= item.threshold * 0.6 ? 'faible' : 'critique'
}

export function summarize(items: StockItem[]) {
  const low = items.filter((i) => levelOf(i) !== 'ok').length
  const critical = items.filter((i) => levelOf(i) === 'critique').length
  const value = items.reduce((sum, i) => sum + Math.round(i.qty * i.unitCost), 0)
  return { count: items.length, low, critical, value }
}

export function formatQty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

const KEY = 'restoben:stock:v1'

// Données de démonstration.
const SEED_ITEMS: StockItem[] = [
  { id: 's-1', name: 'Tomates', unit: 'kg', qty: 45, threshold: 20, unitCost: 600, trend: 5, kind: 'legume' },
  { id: 's-2', name: 'Riz', unit: 'kg', qty: 18, threshold: 25, unitCost: 750, trend: -10, kind: 'cereale' },
  { id: 's-3', name: 'Huile', unit: 'L', qty: 12, threshold: 10, unitCost: 1500, trend: 8, kind: 'huile' },
  { id: 's-4', name: 'Poulet', unit: 'kg', qty: 8, threshold: 15, unitCost: 2800, trend: -12, kind: 'viande' },
  { id: 's-5', name: 'Oignons', unit: 'kg', qty: 30, threshold: 15, unitCost: 500, trend: 3, kind: 'legume' },
  { id: 's-6', name: 'Poisson (carpe)', unit: 'kg', qty: 14, threshold: 12, unitCost: 3000, trend: 6, kind: 'poisson' },
  { id: 's-7', name: 'Igname', unit: 'kg', qty: 60, threshold: 30, unitCost: 400, trend: 2, kind: 'tubercule' },
  { id: 's-8', name: 'Farine de maïs', unit: 'kg', qty: 22, threshold: 20, unitCost: 650, trend: 1, kind: 'cereale' },
  { id: 's-9', name: 'Gombo', unit: 'kg', qty: 6, threshold: 8, unitCost: 900, trend: -9, kind: 'legume' },
  { id: 's-10', name: 'Bœuf', unit: 'kg', qty: 5, threshold: 12, unitCost: 3500, trend: -15, kind: 'viande' },
  { id: 's-11', name: 'Piment frais', unit: 'kg', qty: 4, threshold: 3, unitCost: 1500, trend: -4, kind: 'epice' },
  { id: 's-12', name: 'Jus de bissap', unit: 'L', qty: 24, threshold: 20, unitCost: 800, trend: 7, kind: 'boisson' },
]

const SERVER_STATE: State = { items: SEED_ITEMS, movements: [] }

function seedState(now: number): State {
  const h = 3_600_000
  const m = (id: string, i: number, type: MovementType, qty: number, ago: number, note?: string): StockMovement => {
    const item = SEED_ITEMS[i]!
    return { id, itemId: item.id, itemName: item.name, unit: item.unit, type, qty, note, at: now - ago }
  }
  return {
    items: SEED_ITEMS,
    movements: [
      m('m-1', 0, 'entree', 20, 1.5 * h, 'Livraison du marché'),
      m('m-2', 1, 'sortie', 10, 2.5 * h, 'Service du midi'),
      m('m-3', 2, 'entree', 5, 20 * h),
      m('m-4', 3, 'sortie', 6, 26 * h, 'Poulet Yassa'),
      m('m-5', 9, 'sortie', 3, 30 * h),
    ],
  }
}

let cache: State | null = null
const listeners = new Set<() => void>()

function isState(value: unknown): value is State {
  const v = value as State | null
  return (
    !!v &&
    Array.isArray(v.items) &&
    Array.isArray(v.movements) &&
    v.items.every((i) => i && typeof i.id === 'string' && typeof i.name === 'string' && typeof i.qty === 'number' && typeof i.threshold === 'number' && units.includes(i.unit)) &&
    v.movements.every((x) => x && typeof x.id === 'string' && typeof x.qty === 'number' && typeof x.at === 'number')
  )
}

function read(): State {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return seedState(Date.now())
    const parsed: unknown = JSON.parse(raw)
    return isState(parsed) ? parsed : seedState(Date.now())
  } catch {
    return seedState(Date.now())
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
  return SERVER_STATE
}

/** Enregistre le nouvel état. Renvoie false si le navigateur n'a plus de place. */
function commit(next: State): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    return false
  }
  cache = next
  emit()
  return true
}

export function useStock(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

export type MovementResult = { ok: true } | { ok: false; error: string }

export const stockActions = {
  newId: () => uid('s'),

  /** Ajoute l'article, ou met à jour celui qui a le même id. */
  saveItem(item: StockItem): boolean {
    const s = getSnapshot()
    const exists = s.items.some((i) => i.id === item.id)
    return commit({ ...s, items: exists ? s.items.map((i) => (i.id === item.id ? item : i)) : [...s.items, item] })
  },

  removeItem(id: string): boolean {
    const s = getSnapshot()
    return commit({ ...s, items: s.items.filter((i) => i.id !== id) })
  },

  /** Entrée ou sortie de stock : met à jour la quantité, la variation et l'historique. */
  addMovement(itemId: string, type: MovementType, qty: number, note?: string): MovementResult {
    const s = getSnapshot()
    const item = s.items.find((i) => i.id === itemId)
    if (!item) return { ok: false, error: 'Article introuvable.' }
    if (!Number.isFinite(qty) || qty <= 0) return { ok: false, error: 'Indiquez une quantité supérieure à zéro.' }
    const next = type === 'entree' ? item.qty + qty : item.qty - qty
    if (next < 0) return { ok: false, error: `Stock insuffisant : il reste ${formatQty(item.qty)} ${item.unit}.` }
    const rounded = Math.round(next * 100) / 100
    const trend = item.qty > 0 ? Math.round(((rounded - item.qty) / item.qty) * 100) : 100
    const movement: StockMovement = { id: uid('m'), itemId, itemName: item.name, unit: item.unit, type, qty, note: note?.trim() || undefined, at: Date.now() }
    const saved = commit({
      items: s.items.map((i) => (i.id === itemId ? { ...i, qty: rounded, trend } : i)),
      movements: [movement, ...s.movements].slice(0, 200),
    })
    return saved ? { ok: true } : { ok: false, error: 'Enregistrement impossible : le stockage du navigateur est plein.' }
  },
}
