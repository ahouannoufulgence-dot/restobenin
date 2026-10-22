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

export const isCurrentPeriod = (period: Period, anchor: Date, now = new Date()) => rangeOf(period, anchor).start.getTime() === rangeOf(period, now).start.getTime()

/** Commandes encaissées dans [startMs, endMs[ : vraies commandes + historique fictif si demandé. */
export function paidOrdersBetween(live: StoreOrder[], includeDemo: boolean, startMs: number, endMs: number): StoreOrder[] {
  const real = live.filter((o) => o.payment && o.payment.at >= startMs && o.payment.at < endMs && (includeDemo || !o.demo))
  return includeDemo ? [...demoOrdersBetween(startMs, endMs), ...real] : real
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
  previous: { revenue: number; count: number; average: number } | null
  /** true si la période est en cours : la comparaison porte sur la même durée écoulée de la période précédente. */
  partial: boolean
  seriesTitle: string
  series: { label: string; value: number }[]
  topDishes: { name: string; qty: number; revenue: number }[]
  byMethod: { method: PayMethod; label: string; total: number; count: number }[]
  peak: { label: string; value: number } | null
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function totals(orders: StoreOrder[]) {
  const revenue = orders.reduce((s, o) => s + o.total, 0)
  return { revenue, count: orders.length, average: orders.length ? Math.round(revenue / orders.length) : 0 }
}

export function buildReport(live: StoreOrder[], includeDemo: boolean, period: Period, anchor: Date): Report {
  const { start, end } = rangeOf(period, anchor)
  const orders = paidOrdersBetween(live, includeDemo, start.getTime(), end.getTime())
  const prevAnchor = shiftAnchor(period, anchor, -1)
  const prevRange = rangeOf(period, prevAnchor)
  // Période en cours : on compare avec le même laps de temps écoulé de la période précédente.
  const nowMs = Date.now()
  const partial = nowMs > start.getTime() && nowMs < end.getTime()
  const prevEnd = partial ? Math.min(prevRange.end.getTime(), prevRange.start.getTime() + (nowMs - start.getTime())) : prevRange.end.getTime()
  const prev = totals(paidOrdersBetween(live, includeDemo, prevRange.start.getTime(), prevEnd))
  const now = totals(orders)

  // série
  let seriesTitle = ''
  let series: { label: string; value: number }[] = []
  const hours = new Array(24).fill(0) as number[]
  for (const o of orders) hours[new Date(o.payment!.at).getHours()] += o.total

  if (period === 'jour') {
    seriesTitle = 'Ventes par heure'
    const nonZero = hours.map((v, h) => (v > 0 ? h : -1)).filter((h) => h >= 0)
    const from = Math.min(10, nonZero[0] ?? 10)
    const to = Math.max(22, nonZero[nonZero.length - 1] ?? 22)
    series = Array.from({ length: to - from + 1 }, (_, i) => ({ label: `${from + i}h`, value: hours[from + i] }))
  } else if (period === 'semaine') {
    seriesTitle = 'Ventes par jour'
    const values = new Array(7).fill(0) as number[]
    for (const o of orders) values[(new Date(o.payment!.at).getDay() + 6) % 7] += o.total
    series = values.map((value, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      return { label: `${DAYS[i]} ${d.getDate()}`, value }
    })
  } else if (period === 'mois') {
    seriesTitle = 'Ventes par jour'
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000)
    const values = new Array(days).fill(0) as number[]
    for (const o of orders) values[new Date(o.payment!.at).getDate() - 1] += o.total
    series = values.map((value, i) => ({ label: String(i + 1), value }))
  } else {
    seriesTitle = 'Ventes par mois'
    const values = new Array(12).fill(0) as number[]
    for (const o of orders) values[new Date(o.payment!.at).getMonth()] += o.total
    series = values.map((value, i) => ({ label: MONTHS[i], value }))
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
    ...now,
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
export function change(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

/** Chiffres du jour pour le tableau de bord. */
export function todayStats(live: StoreOrder[], includeDemo: boolean, now = new Date()) {
  const today = rangeOf('jour', now)
  const orders = paidOrdersBetween(live, includeDemo, today.start.getTime(), today.end.getTime())
  const yesterday = rangeOf('jour', shiftAnchor('jour', now, -1))
  const yOrders = paidOrdersBetween(live, includeDemo, yesterday.start.getTime(), yesterday.end.getTime())
  const t = totals(orders)
  const y = totals(yOrders)
  const hourNow = now.getHours()
  const from = 8
  const cumulative: number[] = []
  let sum = 0
  for (let h = from; h <= Math.max(hourNow, from + 3); h++) {
    sum += orders.filter((o) => new Date(o.payment!.at).getHours() === h).reduce((s, o) => s + o.total, 0)
    cumulative.push(sum)
  }
  return { ...t, change: change(t.revenue, y.revenue), points: cumulative }
}
