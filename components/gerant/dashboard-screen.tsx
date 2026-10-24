'use client'

import Image from 'next/image'
import { ArrowDown, ArrowUp, ChevronRight, ClipboardList, Armchair, ShoppingCart, Star, User, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa, type ManagerView, type RestaurantTable } from '@/lib/gerant-data'
import type { MenuDish } from '@/lib/menu-store'
import type { StoreOrder } from '@/lib/orders-store'
import { DAY_END_HOUR, DAY_START_HOUR, type todayStats } from '@/lib/reports'
import { useNow } from '@/lib/use-now'
import { MobileTopBar } from './mobile-top-bar'

const num = (n: number) => n.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')
const card = 'rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]'

/** Courbe lissée qui ne dépasse jamais les points (interpolation monotone). */
function smoothPath(pts: [number, number][]) {
  const n = pts.length
  if (n < 2) return ''
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0])
    slope.push((pts[i + 1][1] - pts[i][1]) / dx[i])
  }
  const t: number[] = [slope[0]]
  for (let i = 1; i < n - 1; i++) t.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2)
  t.push(slope[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      t[i] = 0
      t[i + 1] = 0
      continue
    }
    const a = t[i] / slope[i]
    const b = t[i + 1] / slope[i]
    const s = a * a + b * b
    if (s > 9) {
      const tau = 3 / Math.sqrt(s)
      t[i] = tau * a * slope[i]
      t[i + 1] = tau * b * slope[i]
    }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const h = dx[i] / 3
    d += ` C${(x0 + h).toFixed(1)},${(y0 + t[i] * h).toFixed(1)} ${(x1 - h).toFixed(1)},${(y1 - t[i + 1] * h).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  return d
}

function SalesChart({ hourly }: { hourly: (number | null)[] }) {
  const W = 200
  const H = 100
  const padX = 6
  const top = 10
  const bottom = 94
  const last = Math.max(...hourly.map((v) => v ?? 0), 0)
  const steps = hourly.length - 1
  const pts: [number, number][] = []
  hourly.forEach((v, i) => {
    if (v === null) return
    pts.push([padX + (i / steps) * (W - 2 * padX), bottom - (last > 0 ? (v / last) * (bottom - top) : 0)])
  })
  const line = smoothPath(pts)
  const area = pts.length > 1 ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z` : ''
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMaxYMax meet" className="h-full w-full overflow-visible" role="img" aria-label={`Ventes cumulées de ${DAY_START_HOUR} h à ${DAY_END_HOUR} h : ${fcfa(last)} aujourd’hui`}>
      <defs>
        <linearGradient id="dash-sales-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--ember)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={padX} x2={W - padX} y1={bottom} y2={bottom} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
      {area && <path d={area} fill="url(#dash-sales-fill)" />}
      {line && <path d={line} fill="none" stroke="var(--ember)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.8" fill="var(--card)" stroke="var(--ember)" strokeWidth="1.6" />
      ))}
    </svg>
  )
}

function Contours() {
  return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full text-ember/15" fill="none" stroke="currentColor" strokeWidth="0.6" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d={`M-10 ${120 - i * 7} C 60 ${96 - i * 6}, 110 ${150 - i * 8}, 170 ${112 - i * 7} S 270 ${70 - i * 5}, 330 ${52 - i * 5}`} />
      ))}
    </svg>
  )
}

function Delta({ value, suffix = 'vs hier' }: { value: number | null; suffix?: string }) {
  if (value === null) return null
  const up = value >= 0
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-medium', up ? 'text-success' : 'text-destructive')}>
      <Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
      <span className="tabular-nums">
        {up ? '+' : ''}
        {value}%
      </span>
      <span className="font-normal text-muted-foreground">{suffix}</span>
    </span>
  )
}

function Metric({ icon: Icon, tone, label, children, onClick, action }: { icon: LucideIcon; tone: string; label: string; children: React.ReactNode; onClick: () => void; action: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${action} : ${label}`}
      className={cn(card, 'flex flex-col items-start gap-2 p-3 text-left transition-colors hover:border-ember/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 sm:p-4')}
    >
      <span className="flex items-center gap-2">
        <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white sm:size-9', tone)}>
          <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="min-w-0 break-words text-[11px] font-medium leading-tight sm:text-sm">{label}</span>
      </span>
      <span className="flex w-full flex-1 flex-col items-center justify-center text-center">{children}</span>
      <span className="inline-flex w-full items-center justify-center gap-0.5 text-sm font-semibold text-ember-deep" aria-hidden="true">
        Voir <ChevronRight className="size-4" />
      </span>
    </button>
  )
}

function Thumb({ dish, sizes, className }: { dish?: MenuDish; sizes: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-sand', className)}>
      {dish?.image ? (
        <Image src={dish.image} alt={dish.name} fill sizes={sizes} className="object-cover" />
      ) : (
        <UtensilsCrossed className="absolute inset-0 m-auto size-1/3 text-ember-deep/50" strokeWidth={1.4} aria-hidden="true" />
      )}
    </div>
  )
}

const statusPill: Record<string, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-ember-deep' },
  en_cours: { label: 'En cours', className: 'bg-ember' },
  pret: { label: 'Prêt', className: 'bg-[#b8741a]' },
}

function ago(ms: number) {
  const min = Math.max(0, Math.floor(ms / 60_000))
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  return `Il y a ${h} h ${String(min % 60).padStart(2, '0')}`
}

const tableName = (t: string) => (/^\d+$/.test(t) ? `Table ${t.padStart(2, '0')}` : t)

export function DashboardScreen({
  orders,
  dishes,
  tables,
  sales,
  popular,
  firstName,
  pending,
  onNavigate,
}: {
  orders: StoreOrder[]
  dishes: MenuDish[]
  tables: RestaurantTable[]
  sales: ReturnType<typeof todayStats>
  popular: { id: string; name: string; count: number }[]
  firstName: string
  pending: number
  onNavigate: (view: ManagerView) => void
}) {
  const now = useNow(30_000)
  const dishById = new Map(dishes.map((d) => [d.id, d]))
  const active = orders.filter((o) => o.status === 'en_attente' || o.status === 'en_cours' || o.status === 'pret').sort((a, b) => b.createdAt - a.createdAt)
  const occupied = tables.filter((t) => t.status === 'occupee').length
  const occupancy = tables.length ? Math.round((occupied / tables.length) * 100) : 0

  return (
    <>
      <MobileTopBar pending={pending} onNavigate={onNavigate} />

      <header>
        <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">Bonjour, {firstName}</h1>
        <p className="mt-1 text-muted-foreground">Gérez votre restaurant, inspirez votre équipe.</p>
      </header>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6">
        <div className="flex flex-col gap-4 lg:col-start-1">
          <section aria-labelledby="sales-title" className={cn(card, 'relative min-h-44 overflow-hidden p-5 lg:min-h-52')}>
            <Contours />
            <div className="relative">
              <h2 id="sales-title" className="text-sm font-medium">
                Ventes aujourd’hui
              </h2>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
                <span className="font-serif text-4xl font-semibold leading-none tabular-nums sm:text-5xl">{num(sales.revenue)}</span>
                <span className="text-lg font-medium text-ember-deep">FCFA</span>
              </p>
              <p className="mt-3">
                {sales.change !== null ? <Delta value={sales.change} /> : <span className="text-sm text-muted-foreground">{sales.count} commande{sales.count > 1 ? 's' : ''} encaissée{sales.count > 1 ? 's' : ''}</span>}
              </p>
            </div>
            <div className="pointer-events-none absolute bottom-9 right-4 h-[44%] w-[50%] lg:h-[50%] lg:w-[46%]">
              <SalesChart hourly={sales.hourly} />
            </div>
            <p className="absolute bottom-3 right-5 text-xs text-muted-foreground">
              {String(DAY_START_HOUR).padStart(2, '0')}:00 – {DAY_END_HOUR}:00
            </p>
          </section>

          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3">
            <Metric icon={ClipboardList} tone="bg-ember-deep" label="Commandes en cours" onClick={() => onNavigate('commandes')} action="Voir les commandes">
              <span className="font-serif text-4xl font-semibold tabular-nums leading-none">{active.length}</span>
            </Metric>
            <Metric icon={Armchair} tone="bg-[#b8892a]" label="Tables occupées" onClick={() => onNavigate('tables')} action="Voir les tables">
              <span className="font-serif text-3xl font-semibold tabular-nums leading-none">
                {occupied}
                <span className="font-sans text-base font-normal text-muted-foreground">/{tables.length}</span>
              </span>
              <span className="mt-1 text-xs text-muted-foreground">{occupancy}% d’occupation</span>
            </Metric>
            <Metric icon={ShoppingCart} tone="bg-ember-deep" label="Panier moyen" onClick={() => onNavigate('rapports')} action="Voir les rapports">
              <span className="font-serif text-2xl font-semibold tabular-nums leading-none sm:text-3xl">
                {num(sales.average)} <span className="font-sans text-xs font-medium text-foreground/80">FCFA</span>
              </span>
              <span className="mt-1">
                <Delta value={sales.averageChange} />
              </span>
            </Metric>
          </div>
        </div>

        <section aria-labelledby="todo-title" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 id="todo-title" className="font-serif text-xl font-semibold">
              À traiter maintenant
            </h2>
            <button type="button" onClick={() => onNavigate('commandes')} className="inline-flex items-center gap-0.5 text-sm text-foreground/80 hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
              Tout voir <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          {active.length === 0 ? (
            <p className={cn(card, 'p-6 text-center text-sm text-muted-foreground')}>Rien à traiter pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {active.slice(0, 5).map((o, i) => {
                const first = dishById.get(o.lines[0]?.id)
                const names = o.lines.slice(0, 2).map((l) => l.name).join(' + ') + (o.lines.length > 2 ? ` +${o.lines.length - 2}` : '')
                const pill = statusPill[o.status]
                const sub = o.status === 'en_attente' ? (o.payment ? { t: 'Payée', c: 'text-success' } : { t: 'Encaissement', c: 'text-ember-deep font-medium' }) : o.status === 'en_cours' ? { t: 'En cuisine', c: 'text-muted-foreground' } : { t: 'À récupérer', c: 'text-muted-foreground' }
                return (
                  <li key={o.id} className={i >= 3 ? 'hidden lg:block' : undefined}>
                    <button
                      type="button"
                      onClick={() => onNavigate('commandes')}
                      className={cn(card, 'flex w-full items-center gap-3 p-2 pr-3 text-left transition-colors hover:border-ember/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30')}
                    >
                      <Thumb dish={first} sizes="96px" className="size-16 shrink-0 rounded-xl sm:size-20" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[13px] font-semibold leading-snug sm:text-sm">
                          #{o.number} {names}
                        </span>
                        <span className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white', pill.className)}>{pill.label}</span>
                        <span className="mt-1 flex items-center gap-2.5 whitespace-nowrap text-[11px] text-muted-foreground sm:text-xs">
                          <span>{ago(now - o.createdAt)}</span>
                          <span className="inline-flex items-center gap-1">
                            <User className="size-3.5" aria-hidden="true" />
                            {tableName(o.table)}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-right">
                        <span className="block text-[13px] font-semibold tabular-nums sm:text-sm">{fcfa(o.total)}</span>
                        <span className={cn('block text-xs', sub.c)}>{sub.t}</span>
                      </span>
                      <ChevronRight className="hidden size-4 shrink-0 text-ember-deep sm:block" aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="popular-title" className="lg:col-start-1 lg:row-start-2">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 id="popular-title" className="font-serif text-xl font-semibold">
              Plats populaires aujourd’hui
            </h2>
            <button type="button" onClick={() => onNavigate('menu')} className="inline-flex items-center gap-0.5 text-sm text-foreground/80 hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
              Tout voir <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          {popular.length === 0 ? (
            <p className={cn(card, 'p-6 text-center text-sm text-muted-foreground')}>Pas encore de commande aujourd’hui.</p>
          ) : (
            <ul className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3">
              {popular.map((p) => (
                <li key={p.id} className={cn(card, 'overflow-hidden')}>
                  <Thumb dish={dishById.get(p.id)} sizes="(min-width: 1024px) 200px, 33vw" className="aspect-[4/3] w-full" />
                  <div className="p-2.5">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
                      {p.count} commande{p.count > 1 ? 's' : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
