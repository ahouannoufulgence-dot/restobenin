import { demoOrdersBetween } from './demo-data'
import { payMethodLabels, type PayMethod, type StoreOrder } from './orders-store'

export type Period = 'jour' | 'semaine' | 'mois' | 'annee'

export const periodLabels: Record<Period, string> = { jour: 'Jour', semaine: 'Semaine', mois: 'Mois', annee: 'Année' }

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Début (inclus) et fin (exclue) de la période qui contient `anchor`. Les semaines commencent le lundi. */
export function rangeOf(period: Period, anchor: Date): { start: Date; end: Date } {
  const d = startOfDay(anchor)
  if (period === 'jour') return { start: d, end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) }
  if (period === 'semaine') {
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
    return { start: monday, end: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7) }
  }
  if (period === 'mois') return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 1) }
  return { start: new Date(d.getFullYear(), 0, 1), end: new Date(d.getFullYear() + 1, 0, 1) }
}

export function shiftAnchor(period: Period, anchor: Date, dir: -1 | 1): Date {
  const d = startOfDay(anchor)
  if (period === 'jour') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir)
  if (period === 'semaine') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * dir)
  if (period === 'mois') return new Date(d.getFullYear(), d.getMonth() + dir, 1)
  return new Date(d.getFullYear() + dir, 0, 1)
}

export function periodTitle(period: Period, start: Date, end: Date): string {
  if (period === 'jour') return capitalize(start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  if (period === 'semaine') {
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1)
    const a = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    const b = last.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    return `Semaine du ${a} au ${b}`
  }
  if (period === 'mois') return capitalize(start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
  return `Année ${start.getFullYear()}`
}

/** Titre compact affiché dans le sélecteur de période : « 20 mai – 26 mai 2024 ». */
export function periodShortTitle(period: Period, start: Date, end: Date): string {
  if (period !== 'semaine') return periodTitle(period, start, end).replace(/^Année /, '')
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1)
  const a = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const b = last.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${a} – ${b}`
}

export const isCurrentPeriod = (period: Period, anchor: Date, now = new Date()) => rangeOf(period, anchor).start.getTime() === rangeOf(period, now).start.getTime()

/** Commandes encaissées et annulées dans [startMs, endMs[ : vraies commandes + historique fictif si demandé. */
export function ordersBetween(live: StoreOrder[], includeDemo: boolean, startMs: number, endMs: number): { paid: StoreOrder[]; cancelled: StoreOrder[] } {
  const pool = [...(includeDemo ? demoOrdersBetween(startMs, endMs) : []), ...live.filter((o) => includeDemo || !o.demo)]
  const inRange = (t: number) => t >= startMs && t < endMs
  return {
    paid: pool.filter((o) => o.payment && inRange(o.payment.at)),
    cancelled: pool.filter((o) => o.status === 'annulee' && inRange(o.times.annulee ?? o.createdAt)),
  }
}

/** Commandes encaissées dans [startMs, endMs[ . */
export function paidOrdersBetween(live: StoreOrder[], includeDemo: boolean, startMs: number, endMs: number): StoreOrder[] {
  return ordersBetween(live, includeDemo, startMs, endMs).paid
}

export type Report = {
  period: Period
  title: string
  start: number
  end: number
  revenue: number
  count: number
  average: number
  itemsSold: number
  shortTitle: string
  previous: Pick<Metrics, 'revenue' | 'count' | 'average' | 'occupancy' | 'serviceMin' | 'cancelRate'> | null
  satisfaction: { average: number; count: number } | null
  /** Temps moyen entre la commande et le service à table, en minutes. */
  serviceMin: number | null
  /** Part des commandes annulées, en %. */
  cancelRate: number | null
  /** Part moyenne des tables servies au moins une fois par jour, en %. */
  occupancy: number | null
  topDish: { name: string; qty: number } | null
  bestTable: { table: string; revenue: number } | null
  /** true si la période est en cours : la comparaison porte sur la même durée écoulée de la période précédente. */
  partial: boolean
  seriesTitle: string
  series: { label: string; full: string; value: number }[]
  topDishes: { name: string; qty: number; revenue: number }[]
  byMethod: { method: PayMethod; label: string; total: number; count: number }[]
  peak: { label: string; value: number } | null
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

type Metrics = {
  revenue: number
  count: number
  average: number
  satisfaction: { average: number; count: number } | null
  serviceMin: number | null
  cancelRate: number | null
  occupancy: number | null
}

const DAY_MS = 86_400_000

function metricsOf(paid: StoreOrder[], cancelled: StoreOrder[], startMs: number, endMs: number, tableCount: number): Metrics {
  const revenue = paid.reduce((s, o) => s + o.total, 0)
  const rated = paid.filter((o) => o.review)
  const served = paid.filter((o) => o.times.terminee !== undefined)
  const total = paid.length + cancelled.length

  // Part moyenne des tables servies au moins une fois par jour.
  let occupancy: number | null = null
  if (paid.length > 0 && tableCount > 0) {
    const days = Math.max(1, Math.ceil((Math.min(endMs, Date.now()) - startMs) / DAY_MS))
    const perDay = new Map<string, Set<string>>()
    for (const o of paid) {
      if (!/^\d+$/.test(o.table)) continue
      const key = new Date(o.payment!.at).toDateString()
      const set = perDay.get(key) ?? new Set<string>()
      set.add(o.table)
      perDay.set(key, set)
    }
    let sum = 0
    perDay.forEach((set) => (sum += Math.min(1, set.size / tableCount)))
    occupancy = Math.round((sum / days) * 100)
  }

  return {
    revenue,
    count: paid.length,
    average: paid.length ? Math.round(revenue / paid.length) : 0,
    satisfaction: rated.length ? { average: rated.reduce((s, o) => s + o.review!.rating, 0) / rated.length, count: rated.length } : null,
    serviceMin: served.length ? Math.round(served.reduce((s, o) => s + (o.times.terminee! - o.createdAt), 0) / served.length / 60_000) : null,
    cancelRate: total > 0 ? Math.round((cancelled.length / total) * 1000) / 10 : null,
    occupancy,
  }
}

export function buildReport(live: StoreOrder[], includeDemo: boolean, period: Period, anchor: Date, tableCount = 12): Report {
  const { start, end } = rangeOf(period, anchor)
  const cur = ordersBetween(live, includeDemo, start.getTime(), end.getTime())
  const orders = cur.paid
  const prevAnchor = shiftAnchor(period, anchor, -1)
  const prevRange = rangeOf(period, prevAnchor)
  // Période en cours : on compare avec le même laps de temps écoulé de la période précédente.
  const nowMs = Date.now()
  const partial = nowMs > start.getTime() && nowMs < end.getTime()
  const prevEnd = partial ? Math.min(prevRange.end.getTime(), prevRange.start.getTime() + (nowMs - start.getTime())) : prevRange.end.getTime()
  const prevOrders = ordersBetween(live, includeDemo, prevRange.start.getTime(), prevEnd)
  const prev = metricsOf(prevOrders.paid, prevOrders.cancelled, prevRange.start.getTime(), prevEnd, tableCount)
  const now = metricsOf(orders, cur.cancelled, start.getTime(), end.getTime(), tableCount)

  // série
  let seriesTitle = ''
  let series: { label: string; full: string; value: number }[] = []
  const hours = new Array(24).fill(0) as number[]
  for (const o of orders) hours[new Date(o.payment!.at).getHours()] += o.total

  if (period === 'jour') {
    seriesTitle = 'Ventes par heure'
    const nonZero = hours.map((v, h) => (v > 0 ? h : -1)).filter((h) => h >= 0)
    const from = Math.min(10, nonZero[0] ?? 10)
    const to = Math.max(22, nonZero[nonZero.length - 1] ?? 22)
    series = Array.from({ length: to - from + 1 }, (_, i) => ({ label: `${from + i}h`, full: `${from + i}h`, value: hours[from + i] }))
  } else if (period === 'semaine') {
    seriesTitle = 'Ventes par jour'
    const values = new Array(7).fill(0) as number[]
    for (const o of orders) values[(new Date(o.payment!.at).getDay() + 6) % 7] += o.total
    series = values.map((value, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      return { label: DAYS[i], full: `${DAYS[i]} ${d.getDate()}`, value }
    })
  } else if (period === 'mois') {
    seriesTitle = 'Ventes par jour'
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000)
    const values = new Array(days).fill(0) as number[]
    for (const o of orders) values[new Date(o.payment!.at).getDate() - 1] += o.total
    series = values.map((value, i) => ({ label: String(i + 1), full: `Jour ${i + 1}`, value }))
  } else {
    seriesTitle = 'Ventes par mois'
    const values = new Array(12).fill(0) as number[]
    for (const o of orders) values[new Date(o.payment!.at).getMonth()] += o.total
    series = values.map((value, i) => ({ label: MONTHS[i], full: MONTHS[i], value }))
  }

  // plats
  const dishMap = new Map<string, { name: string; qty: number; revenue: number }>()
  let itemsSold = 0
  for (const o of orders) {
    for (const l of o.lines) {
      itemsSold += l.qty
      const cur = dishMap.get(l.id) ?? { name: l.name, qty: 0, revenue: 0 }
      cur.qty += l.qty
      cur.revenue += l.qty * l.price
      dishMap.set(l.id, cur)
    }
  }
  const topDishes = [...dishMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  const bestSeller = [...dishMap.values()].sort((a, b) => b.qty - a.qty)[0]
  const tableMap = new Map<string, number>()
  for (const o of orders) if (/^\d+$/.test(o.table)) tableMap.set(o.table, (tableMap.get(o.table) ?? 0) + o.total)
  const bestTableEntry = [...tableMap.entries()].sort((a, b) => b[1] - a[1])[0]

  // paiements
  const methods: PayMethod[] = ['especes', 'mobile_money', 'carte']
  const byMethod = methods.map((method) => {
    const sel = orders.filter((o) => o.payment!.method === method)
    return { method, label: payMethodLabels[method], total: sel.reduce((s, o) => s + o.total, 0), count: sel.length }
  })

  // heure de pointe
  const maxHour = hours.reduce((best, v, h) => (v > hours[best] ? h : best), 0)
  const peak = hours[maxHour] > 0 ? { label: `${maxHour}h – ${maxHour + 1}h`, value: hours[maxHour] } : null

  return {
    period,
    title: periodTitle(period, start, end),
    start: start.getTime(),
    end: end.getTime(),
    shortTitle: periodShortTitle(period, start, end),
    revenue: now.revenue,
    count: now.count,
    average: now.average,
    satisfaction: now.satisfaction,
    serviceMin: now.serviceMin,
    cancelRate: now.cancelRate,
    occupancy: now.occupancy,
    topDish: bestSeller ? { name: bestSeller.name, qty: bestSeller.qty } : null,
    bestTable: bestTableEntry ? { table: bestTableEntry[0], revenue: bestTableEntry[1] } : null,
    itemsSold,
    previous: prev.count > 0 ? prev : null,
    partial,
    seriesTitle,
    series,
    topDishes,
    byMethod,
    peak,
  }
}

/** Variation en % entre deux valeurs, ou null s'il n'y a pas de base de comparaison. */
/** Écart en points entre deux taux (ex. 3,2 % contre 4,3 % : -1,1). */
export function pointsDiff(current: number | null, previous: number | null | undefined, decimals = 0): number | null {
  if (current === null || previous === null || previous === undefined) return null
  const f = 10 ** decimals
  return Math.round((current - previous) * f) / f
}

export function change(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export const DAY_START_HOUR = 8
export const DAY_END_HOUR = 21

/** Chiffres du jour pour le tableau de bord. */
export function todayStats(live: StoreOrder[], includeDemo: boolean, now = new Date()) {
  const today = rangeOf('jour', now)
  const orders = paidOrdersBetween(live, includeDemo, today.start.getTime(), today.end.getTime())
  // Comparaison « vs hier » à la même heure : on ne compare pas une journée en cours à une journée entière.
  const yesterday = rangeOf('jour', shiftAnchor('jour', now, -1))
  const elapsed = Math.min(now.getTime() - today.start.getTime(), yesterday.end.getTime() - yesterday.start.getTime())
  const yOrders = paidOrdersBetween(live, includeDemo, yesterday.start.getTime(), yesterday.start.getTime() + elapsed)
  const sum = (list: StoreOrder[]) => list.reduce((s, o) => s + o.total, 0)
  const revenue = sum(orders)
  const yRevenue = sum(yOrders)
  const average = orders.length ? Math.round(revenue / orders.length) : 0
  const yAverage = yOrders.length ? Math.round(sum(yOrders) / yOrders.length) : 0

  // Ventes cumulées heure par heure, de 8 h à 21 h (vide pour les heures à venir).
  const hourNow = now.getHours()
  const hourly: (number | null)[] = []
  let running = 0
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) {
    if (h > hourNow) {
      hourly.push(null)
      continue
    }
    running += orders.filter((o) => new Date(o.payment!.at).getHours() === h).reduce((s, o) => s + o.total, 0)
    hourly.push(running)
  }
  // Les ventes hors horaires (avant 8 h) sont comptées dès le premier point.
  const early = orders.filter((o) => new Date(o.payment!.at).getHours() < DAY_START_HOUR).reduce((s, o) => s + o.total, 0)
  if (early > 0) for (let i = 0; i < hourly.length; i++) if (hourly[i] !== null) hourly[i] = (hourly[i] as number) + early

  return {
    revenue,
    count: orders.length,
    average,
    change: change(revenue, yRevenue),
    averageChange: change(average, yAverage),
    hourly,
  }
}

/** Plats les plus commandés aujourd'hui (nombre de commandes qui les contiennent). */
export function popularToday(live: StoreOrder[], includeDemo: boolean, limit = 3, now = new Date()): { id: string; name: string; count: number }[] {
  const today = rangeOf('jour', now)
  const startMs = today.start.getTime()
  const endMs = today.end.getTime()
  const pool = [
    ...live.filter((o) => (includeDemo || !o.demo) && o.status !== 'annulee' && o.createdAt >= startMs && o.createdAt < endMs),
    ...(includeDemo ? demoOrdersBetween(startMs, endMs).filter((o) => o.status !== 'annulee') : []),
  ]
  const counts = new Map<string, { id: string; name: string; count: number }>()
  for (const o of pool) {
    for (const l of o.lines) {
      const cur = counts.get(l.id) ?? { id: l.id, name: l.name, count: 0 }
      cur.count += 1
      counts.set(l.id, cur)
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}
