import { useSyncExternalStore } from 'react'
import { SERVICE_FEE, catalog, type OrderLine } from './client-data'
import type { OrderStatus } from './gerant-data'
import { getSupabase } from './supabase/client'
import { friendlyError, getRemote, onRemoteReset, rehydrate, reportSyncError } from './supabase/runtime'

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
  /** Mode base de données : identifiant réel dans Supabase (absent tant que la commande vient d'être créée). */
  serverId?: string
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
  if (getRemote()) return // mode base de données : la mémoire du navigateur ne sert plus
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

/* ------------------------------------------------------------------ mode base de données */
/* Les commandes viennent de Supabase (jamais du navigateur). L'écran se met à jour tout de suite, puis la base est
   mise à jour en arrière-plan ; en cas d'échec, une erreur s'affiche et l'état réel est rechargé. */

const WINDOW_DAYS = 90
const POLL_DAYS = 3
let mutating = 0 // enregistrements en cours
let version = 0 // change à chaque action, pour ignorer une lecture devenue périmée
const creating = new Map<string, Promise<string | null>>() // id provisoire -> id réel

onRemoteReset(() => {
  creating.clear()
  cache = null
  emit()
})

type RawOrder = {
  id: string
  number: number
  table_label: string
  source: 'client' | 'comptoir'
  subtotal_fcfa: number
  service_fee_fcfa: number
  total_fcfa: number
  status: OrderStatus
  created_at: string
  in_progress_at: string | null
  ready_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  order_items: { menu_item_id: string | null; name: string; unit_price_fcfa: number; quantity: number }[] | null
  payments: RawPayment | RawPayment[] | null
  reviews: RawReview | RawReview[] | null
}
type RawPayment = { method: PayMethod; received_fcfa: number; change_fcfa: number; paid_at: string }
type RawReview = { rating: number; comment: string | null; created_at: string }

const ORDER_SELECT =
  'id, number, table_label, source, subtotal_fcfa, service_fee_fcfa, total_fcfa, status, created_at, in_progress_at, ready_at, completed_at, cancelled_at, ' +
  'order_items(menu_item_id, name, unit_price_fcfa, quantity), payments(method, received_fcfa, change_fcfa, paid_at), reviews(rating, comment, created_at)'

const firstOf = <T,>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : (v ?? undefined))
const stamp = (v: string | null) => (v ? Date.parse(v) : undefined)

function mapRemote(r: RawOrder): StoreOrder {
  const pay = firstOf(r.payments)
  const rev = firstOf(r.reviews)
  const times: StoreOrder['times'] = {}
  const set = (k: keyof StoreOrder['times'], v: string | null) => {
    const t = stamp(v)
    if (t !== undefined) times[k] = t
  }
  set('en_cours', r.in_progress_at)
  set('pret', r.ready_at)
  set('terminee', r.completed_at)
  set('annulee', r.cancelled_at)
  return {
    id: r.id,
    serverId: r.id,
    number: String(r.number).padStart(4, '0'),
    table: r.table_label,
    lines: (r.order_items ?? []).map((i) => ({ id: i.menu_item_id ?? '', name: i.name, qty: i.quantity, price: i.unit_price_fcfa })),
    subtotal: r.subtotal_fcfa,
    serviceFee: r.service_fee_fcfa,
    total: r.total_fcfa,
    status: r.status,
    createdAt: Date.parse(r.created_at),
    times,
    source: r.source,
    ...(pay ? { payment: { at: Date.parse(pay.paid_at), method: pay.method, received: pay.received_fcfa, change: pay.change_fcfa } } : {}),
    ...(rev ? { review: { rating: rev.rating, comment: rev.comment ?? '', at: Date.parse(rev.created_at) } } : {}),
  }
}

/** Lit les commandes des `days` derniers jours du restaurant connecté. */
export async function loadRemoteOrders(days: number): Promise<StoreOrder[]> {
  const ctx = getRemote()
  if (!ctx) return []
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const { data, error } = await getSupabase()
    .from('orders')
    .select(ORDER_SELECT)
    .eq('restaurant_id', ctx.restaurantId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2000)
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as RawOrder[]).map(mapRemote)
}

/** Met en place les commandes lues : celles reçues remplacent les locales, l'identifiant affiché reste stable. */
export function applyRemoteOrders(fetched: StoreOrder[], keepOlderThan: number) {
  const current = cache ?? []
  const localByServer = new Map<string, StoreOrder>()
  for (const o of current) if (o.serverId) localByServer.set(o.serverId, o)
  const seen = new Set(fetched.map((f) => f.serverId))
  const merged = fetched.map((f) => {
    const local = f.serverId ? localByServer.get(f.serverId) : undefined
    return local ? { ...f, id: local.id } : f
  })
  const keep = current.filter((o) => !(o.serverId && seen.has(o.serverId)) && (creating.has(o.id) || (!!o.serverId && o.createdAt < keepOlderThan)))
  cache = [...merged, ...keep].sort((a, b) => a.createdAt - b.createdAt)
  emit()
}

/** Relit les commandes récentes (appelé régulièrement) : nouvelles commandes des clients, changements faits ailleurs. */
export async function refreshRemoteOrders() {
  if (!getRemote() || mutating > 0) return
  const seen = version
  try {
    const fresh = await loadRemoteOrders(POLL_DAYS)
    if (mutating > 0 || version !== seen || !getRemote()) return // une action a eu lieu pendant la lecture : on réessaiera
    applyRemoteOrders(fresh, Date.now() - POLL_DAYS * 86_400_000)
  } catch {
    /* connexion coupée : on réessaiera au prochain passage */
  }
}
export const REMOTE_ORDERS_WINDOW_DAYS = WINDOW_DAYS

function remoteCommit(next: StoreOrder[]) {
  version++
  cache = next
  emit()
}

/** Exécute un enregistrement dans la base. Renvoie les données, ou null en cas d'échec (erreur affichée, état rechargé). */
async function run(label: string, task: () => PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<unknown> {
  mutating++
  let failed = false
  try {
    const res = await task()
    if (res.error) throw new Error(res.error.message)
    return res.data ?? true
  } catch (e) {
    failed = true
    reportSyncError(`${label} : ${friendlyError(e instanceof Error ? e.message : String(e))}`)
    return null
  } finally {
    mutating--
    if (failed) void rehydrate()
  }
}

async function serverIdOf(id: string): Promise<string | null> {
  const known = (cache ?? []).find((o) => o.id === id)?.serverId
  if (known) return known
  const pending = creating.get(id)
  return pending ? await pending : null
}

function createRemote(restaurantId: string, input: { table: string; lines: OrderLine[] }): StoreOrder {
  const list = getSnapshot()
  const subtotal = input.lines.reduce((s, l) => s + l.price * l.qty, 0)
  const provisional = String(list.reduce((m, o) => Math.max(m, Number.parseInt(o.number, 10) || 0), 1000) + 1).padStart(4, '0')
  const local: StoreOrder = {
    id: `tmp-${crypto.randomUUID()}`,
    number: provisional,
    table: input.table,
    lines: input.lines,
    subtotal,
    serviceFee: 0,
    total: subtotal,
    status: 'en_attente',
    createdAt: Date.now(),
    times: {},
    source: 'comptoir',
  }
  remoteCommit([...list, local])
  const done = run('Création de la commande', () =>
    getSupabase().rpc('create_order', { p_restaurant: restaurantId, p_table: input.table, p_lines: input.lines.map((l) => ({ id: l.id, qty: l.qty })) }),
  ).then((data) => {
    const res = data && typeof data === 'object' ? (data as { id?: string; number?: number; total?: number }) : null
    if (!res?.id) {
      remoteCommit(getSnapshot().filter((o) => o.id !== local.id)) // la commande n'a pas été créée
      return null
    }
    cache = getSnapshot().map((o) => (o.id === local.id ? { ...o, serverId: res.id, number: String(res.number ?? o.number).padStart(4, '0'), total: res.total ?? o.total } : o))
    emit()
    return res.id
  })
  creating.set(local.id, done)
  void done.finally(() => creating.delete(local.id))
  return local
}

export const ordersActions = {
  /** Crée une commande (client ou comptoir). Renvoie null si le navigateur n'a plus de place. */
  create(input: { table: string; lines: OrderLine[]; source: 'client' | 'comptoir' }): StoreOrder | null {
    const remote = getRemote()
    if (remote) return createRemote(remote.restaurantId, input)
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
    const next = getSnapshot().map((o) => {
      if (o.id !== id) return o
      const times = { ...o.times }
      if (status === 'en_cours') times.en_cours = now
      if (status === 'pret') times.pret = now
      if (status === 'terminee') times.terminee = now
      if (status === 'annulee') times.annulee = now
      return { ...o, status, times }
    })
    if (!getRemote()) return commit(next)
    remoteCommit(next)
    void serverIdOf(id).then((sid) => (sid ? run('Mise à jour de la commande', () => getSupabase().from('orders').update({ status }).eq('id', sid)) : null))
    return true
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
    if (!getRemote()) return commit(list.map((o) => (o.id === id ? paid : o))) ? paid : null
    remoteCommit(list.map((o) => (o.id === id ? paid : o)))
    void serverIdOf(id).then((sid) =>
      sid ? run('Encaissement', () => getSupabase().rpc('collect_payment', { p_order: sid, p_method: method, p_received: payment.received })) : null,
    )
    return paid
  },

  /** Enregistre l'avis du client sur sa commande (note de 1 à 5). */
  review(id: string, rating: number, comment: string) {
    if (getRemote()) return false // les avis sont déposés par les clients depuis leur téléphone (étape à venir)
    const value = Math.min(5, Math.max(1, Math.round(rating)))
    return commit(getSnapshot().map((o) => (o.id === id ? { ...o, review: { rating: value, comment: comment.trim(), at: Date.now() } } : o)))
  },

  /** Supprime les commandes fictives de démonstration. */
  clearDemo() {
    if (getRemote()) return true // rien à supprimer : en mode base de données il n'y a pas de données d'exemple
    return commit(getSnapshot().filter((o) => !o.demo))
  },
}
