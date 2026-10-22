import { catalog } from './client-data'
import type { PayMethod, StoreOrder } from './orders-store'

/**
 * Historique fictif de ventes, pour que les rapports (jour, semaine, mois, année) aient de la matière
 * avant les premières vraies commandes. Généré à la volée, jour par jour, de façon reproductible.
 */

const DAY_MS = 86_400_000
export const DEMO_DAYS = 760

function startOfDay(ms: number) {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const weights: Record<string, number> = { 'd-yassa': 9, 'd-riz': 6, 'd-mafe': 7, 'd-akassa': 3, 'd-bissap': 6, 'd-gingembre': 4, 'd-eau': 3, 'd-tiramisu': 3 }
const dishes = catalog.map((d) => ({ ...d, w: weights[d.id] ?? 2 }))
const totalWeight = dishes.reduce((s, d) => s + d.w, 0)

// heure -> poids (pics du midi et du soir)
const hourWeights: [number, number][] = [[11, 2], [12, 8], [13, 9], [14, 4], [15, 1], [18, 3], [19, 8], [20, 9], [21, 6], [22, 2]]
const hourTotal = hourWeights.reduce((s, [, w]) => s + w, 0)

function pick<T>(rand: () => number, items: T[], w: (i: T) => number, total: number) {
  let r = rand() * total
  for (const it of items) {
    r -= w(it)
    if (r <= 0) return it
  }
  return items[items.length - 1]
}

function methodFor(rand: () => number): PayMethod {
  const r = rand()
  return r < 0.45 ? 'especes' : r < 0.87 ? 'mobile_money' : 'carte'
}

/** Commandes fictives d'une journée (dayStart = minuit local, en ms). */
export function demoOrdersForDay(dayStart: number): StoreOrder[] {
  const dayIndex = Math.round(dayStart / DAY_MS)
  const rand = mulberry32(dayIndex * 7919 + 13)
  const date = new Date(dayStart)
  const weekday = (date.getDay() + 6) % 7 // 0 = lundi
  const base = [16, 17, 18, 20, 30, 38, 33][weekday]
  const ageDays = Math.max(0, (startOfDay(Date.now()) - dayStart) / DAY_MS)
  const growth = 1 - Math.min(0.3, ageDays / 760 * 0.3) // la fréquentation grandit avec le temps
  const count = Math.max(4, Math.round(base * growth * (0.8 + rand() * 0.4)))
  const out: StoreOrder[] = []
  for (let i = 0; i < count; i++) {
    const [hour] = pick(rand, hourWeights, ([, w]) => w, hourTotal)
    const createdAt = dayStart + hour * 3_600_000 + Math.floor(rand() * 3_600_000)
    const lineCount = 1 + Math.floor(rand() * 3)
    const map = new Map<string, { id: string; name: string; qty: number; price: number }>()
    for (let l = 0; l < lineCount; l++) {
      const d = pick(rand, dishes, (x) => x.w, totalWeight)
      const qty = 1 + (rand() < 0.3 ? 1 : 0)
      const cur = map.get(d.id)
      if (cur) cur.qty += qty
      else map.set(d.id, { id: d.id, name: d.name, qty, price: d.price })
    }
    const lines = [...map.values()]
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
    const serviceFee = 500
    const total = subtotal + serviceFee
    const method = methodFor(rand)
    const received = method === 'especes' ? Math.ceil(total / 1000) * 1000 : total
    out.push({
      id: `demo-${dayIndex}-${i}`,
      number: String(i + 1).padStart(4, '0'),
      table: String(1 + Math.floor(rand() * 12)),
      lines,
      subtotal,
      serviceFee,
      total,
      status: 'terminee',
      createdAt,
      times: { en_cours: createdAt + 2 * 60_000, pret: createdAt + 15 * 60_000, terminee: createdAt + 20 * 60_000 },
      payment: { at: createdAt + 35 * 60_000, method, received, change: received - total },
      source: 'client',
      demo: true,
    })
  }
  return out
}

/** Commandes fictives dont le paiement tombe dans [startMs, endMs[ — uniquement les jours passés (avant aujourd'hui). */
export function demoOrdersBetween(startMs: number, endMs: number): StoreOrder[] {
  const todayStart = startOfDay(Date.now())
  const first = Math.max(startOfDay(startMs), todayStart - DEMO_DAYS * DAY_MS)
  const last = Math.min(endMs, todayStart)
  const out: StoreOrder[] = []
  for (let day = first; day < last; ) {
    for (const o of demoOrdersForDay(day)) {
      if (o.payment && o.payment.at >= startMs && o.payment.at < endMs) out.push(o)
    }
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    day = next.getTime()
  }
  return out
}
