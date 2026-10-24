import { useSyncExternalStore } from 'react'
import { SERVICE_FEE, catalog, type OrderLine } from './client-data'
import type { OrderStatus } from './gerant-data'

/**
 * Commandes partagées entre tous les modules : espace client, commandes, cuisine, caisse, rapports.
 * Elles sont gardées dans le navigateur (localStorage) en attendant la base de données : tous les
 * modules ouverts sur le même appareil se mettent à jour en direct, y compris entre deux onglets.
 */

export type PayMethod = 'especes' | 'mobile_money' | 'carte'

export const payMethodLabels: Record<PayMethod, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  carte: 'Carte bancaire',
}

export type Payment = { at: number; method: PayMethod; received: number; change: number }

/** Avis laissé par le client à la fin du repas. */
export type OrderReview = { rating: number; comment: string; at: number }

export type StoreOrder = {
  id: string
  number: string
  /** Numéro de table ("12") ou "Comptoir". */
  table: string
  lines: OrderLine[]
  subtotal: number
  serviceFee: number
  total: number
  status: OrderStatus
  createdAt: number
  times: { en_cours?: number; pret?: number; terminee?: number; annulee?: number }
  payment?: Payment
  review?: OrderReview
  source: 'client' | 'comptoir'
  /** Donnée fictive de démonstration. */
  demo?: boolean
}

export const stageOf: Record<OrderStatus, number> = { en_attente: 0, en_cours: 1, pret: 2, terminee: 3, annulee: 0 }

export function tableLabel(table: string) {
  return /^\d+$/.test(table) ? `Table ${table}` : table
}

export const isOpen = (o: StoreOrder) => o.status !== 'annulee' && o.status !== 'terminee'
export const isUnpaid = (o: StoreOrder) => !o.payment && o.status !== 'annulee'

// ---------- données de démonstration du jour ----------

const MIN = 60_000

function makeSeed(now: number): StoreOrder[] {
  const price = (id: string) => catalog.find((c) => c.id === id)?.price ?? 0
  const name = (id: string) => catalog.find((c) => c.id === id)?.name ?? id
  const mk = (
    number: string,
    table: string,
    minutesAgo: number,
    status: OrderStatus,
    items: [string, number][],
    paid?: PayMethod,
  ): StoreOrder => {
    const createdAt = now - minutesAgo * MIN
    const lines = items.map(([id, qty]) => ({ id, name: name(id), qty, price: price(id) }))
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
    const total = subtotal + SERVICE_FEE
    const times: StoreOrder['times'] = {}
    if (status !== 'en_attente') times.en_cours = createdAt + 2 * MIN
    if (status === 'pret' || status === 'terminee') times.pret = createdAt + 14 * MIN
    if (status === 'terminee') times.terminee = createdAt + 18 * MIN
    if (status === 'annulee') times.annulee = createdAt + 3 * MIN
    return {
      id: `c-${number}`,
      number,
      table,
      lines,
      subtotal,
      serviceFee: SERVICE_FEE,
      total,
      status,
      createdAt,
      times,
      source: 'client',
      demo: true,
      payment: paid ? { at: createdAt + 30 * MIN, method: paid, received: paid === 'especes' ? Math.ceil(total / 1000) * 1000 : total, change: paid === 'especes' ? Math.ceil(total / 1000) * 1000 - total : 0 } : undefined,
    }
  }
  const orders = [
    mk('1012', '12', 5, 'en_cours', [['d-yassa', 2], ['d-bissap', 2]]),
    mk('1005', '5', 8, 'en_attente', [['d-riz', 1], ['d-gingembre', 1]]),
    mk('1003', '3', 16, 'pret', [['d-mafe', 3], ['d-tiramisu', 1]]),
    mk('1008', '8', 22, 'en_cours', [['d-yassa', 1], ['d-riz', 2]]),
    mk('1001', '1', 28, 'en_attente', [['d-mafe', 1]]),
    mk('1009', '9', 35, 'pret', [['d-riz', 2], ['d-bissap', 2]]),
    mk('1011', '11', 45, 'en_cours', [['d-yassa', 2], ['d-mafe', 2], ['d-eau', 1]]),
    mk('0998', '4', 70, 'terminee', [['d-yassa', 2], ['d-tiramisu', 1]]),
    mk('0995', '2', 95, 'terminee', [['d-riz', 1], ['d-bissap', 2]], 'especes'),
    mk('0990', '7', 125, 'terminee', [['d-mafe', 4], ['d-yassa', 1], ['d-bissap', 1]], 'mobile_money'),
    mk('0987', '6', 150, 'annulee', [['d-yassa', 1]]),
  ]
  const reviewed: Record<string, number> = { '0995': 5, '0990': 4 }
  return orders.map((o) => (reviewed[o.number] ? { ...o, review: { rating: reviewed[o.number], comment: '', at: o.createdAt + 40 * MIN } } : o))
}

// ---------- stockage ----------

const KEY = 'restoben:orders:v1'
const EMPTY: StoreOrder[] = []

let cache: StoreOrder[] | null = null
const listeners = new Set<() => void>()

function isOrders(value: unknown): value is StoreOrder[] {
  return Array.isArray(value) && value.every((o) => o && typeof o.id === 'string' && typeof o.total === 'number' && Array.isArray(o.lines))
}

function read(): StoreOrder[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return makeSeed(Date.now())
    const parsed: unknown = JSON.parse(raw)
    return isOrders(parsed) ? parsed : makeSeed(Date.now())
  } catch {
    return makeSeed(Date.now())
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
const getServerSnapshot = () => EMPTY

function commit(next: StoreOrder[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    return false
  }
  cache = next
  emit()
  return true
}

export function useOrders(): StoreOrder[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

function nextNumber(list: StoreOrder[]) {
  const max = list.reduce((m, o) => Math.max(m, Number.parseInt(o.number, 10) || 0), 1012)
  return String(max + 1).padStart(4, '0')
}

export const ordersActions = {
  /** Crée une commande (client ou comptoir). Renvoie null si le navigateur n'a plus de place. */
  create(input: { table: string; lines: OrderLine[]; source: 'client' | 'comptoir' }): StoreOrder | null {
    const list = getSnapshot()
    const subtotal = input.lines.reduce((s, l) => s + l.price * l.qty, 0)
    const serviceFee = input.source === 'client' ? SERVICE_FEE : 0
    const number = nextNumber(list)
    const order: StoreOrder = {
      id: `c-${number}`,
      number,
      table: input.table,
      lines: input.lines,
      subtotal,
      serviceFee,
      total: subtotal + serviceFee,
      status: 'en_attente',
      createdAt: Date.now(),
      times: {},
      source: input.source,
    }
    return commit([...list, order]) ? order : null
  },

  setStatus(id: string, status: OrderStatus) {
    const now = Date.now()
    return commit(
      getSnapshot().map((o) => {
        if (o.id !== id) return o
        const times = { ...o.times }
        if (status === 'en_cours') times.en_cours = now
        if (status === 'pret') times.pret = now
        if (status === 'terminee') times.terminee = now
        if (status === 'annulee') times.annulee = now
        return { ...o, status, times }
      }),
    )
  },

  /** Enregistre le paiement. Renvoie la commande mise à jour, ou null si le paiement est refusé. */
  pay(id: string, method: PayMethod, received: number): StoreOrder | null {
    const list = getSnapshot()
    const order = list.find((o) => o.id === id)
    if (!order || order.payment || order.status === 'annulee') return null
    if (method === 'especes' && received < order.total) return null
    const payment: Payment = {
      at: Date.now(),
      method,
      received: method === 'especes' ? received : order.total,
      change: method === 'especes' ? received - order.total : 0,
    }
    const paid = { ...order, payment }
    return commit(list.map((o) => (o.id === id ? paid : o))) ? paid : null
  },

  /** Enregistre l'avis du client sur sa commande (note de 1 à 5). */
  review(id: string, rating: number, comment: string) {
    const value = Math.min(5, Math.max(1, Math.round(rating)))
    return commit(getSnapshot().map((o) => (o.id === id ? { ...o, review: { rating: value, comment: comment.trim(), at: Date.now() } } : o)))
  },

  /** Supprime les commandes fictives de démonstration. */
  clearDemo() {
    return commit(getSnapshot().filter((o) => !o.demo))
  },
}
