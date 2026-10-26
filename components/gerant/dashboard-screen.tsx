'use client'

import { Bell, ChevronRight, ClipboardList, LayoutGrid, ShoppingCart, Star, User, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Photo } from '@/components/ui/photo'
import { fcfa, type ManagerView, type RestaurantTable } from '@/lib/gerant-data'
import type { MenuDish } from '@/lib/menu-store'
import type { OrderStatus } from '@/lib/gerant-data'
import { isOpen, type StoreOrder } from '@/lib/orders-store'
import type { todayStats } from '@/lib/reports'
import { useNow } from '@/lib/use-now'
import { Panel } from './shared'

/** Montant sans l'unité, pour pouvoir afficher « FCFA » plus petit. */
const amount = (value: number) => fcfa(value).replace(/ FCFA$/, '')

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      {[0, 90, 180, 270].map((deg) => (
        <path key={deg} transform={`rotate(${deg} 20 20)`} d="M20 19c-5-3-8-8-5-12 2-3 5-3 5 1 0 3-1 6 0 11Z" />
      ))}
      <circle cx="20" cy="20" r="2.2" />
    </svg>
  )
}

function Dots({ delta, suffix = 'vs hier' }: { delta: number | null; suffix?: string }) {
  if (delta === null) return <span className="whitespace-nowrap text-[11px] text-muted-foreground sm:text-xs">Pas de comparaison</span>
  const up = delta >= 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium sm:gap-1 sm:text-sm', up ? 'text-success' : 'text-destructive')}>
      <span aria-hidden="true">{up ? '↑' : '↓'}</span>
      {up ? '+' : '−'}
      {Math.abs(delta)}% <span className="font-normal text-foreground/70">{suffix}</span>
    </span>
  )
}

function SalesChart({ points }: { points: number[] }) {
  const W = 300
  const H = 110
  const padX = 8
  const padTop = 12
  const padBottom = 6
  const max = Math.max(...points, 1)
  const data = points.length > 1 ? points : [0, ...points, ...points]
  const coords = data.map((p, i) => [padX + (i / Math.max(data.length - 1, 1)) * (W - padX * 2), padTop + (1 - p / max) * (H - padTop - padBottom)] as const)
  // Courbe lissée (Catmull-Rom → Bézier) pour reproduire le tracé arrondi de la maquette.
  const path = coords
    .map(([x, y], i) => {
      if (i === 0) return `M${x.toFixed(1)},${y.toFixed(1)}`
      const [x0, y0] = coords[i - 2] ?? coords[i - 1]!
      const [x1, y1] = coords[i - 1]!
      const [x3, y3] = coords[i + 1] ?? coords[i]!
      const c1x = x1 + (x - x0) / 6
      const c1y = y1 + (y - y0) / 6
      const c2x = x - (x3 - x1) / 6
      const c2y = y - (y3 - y1) / 6
      return `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const last = coords[coords.length - 1]!
  const first = coords[0]!
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" role="img" aria-label="Évolution cumulée des ventes au fil de la journée">
      <defs>
        <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--ember)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`${path} L${last[0]},${H} L${first[0]},${H} Z`} fill="url(#sales-fill)" />
      <path d={path} stroke="var(--ember-deep)" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.4" fill="var(--card)" stroke="var(--ember-deep)" strokeWidth="1.75" />
      ))}
    </svg>
  )
}

/** Fines vagues décoratives en fond de la carte des ventes. */
function Waves() {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full text-ember/15" viewBox="0 0 400 200" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M0 ${70 + i * 9} C70 ${40 + i * 9} 130 ${110 + i * 7} 210 ${75 + i * 8} S340 ${40 + i * 9} 400 ${70 + i * 7}`} />
      ))}
    </svg>
  )
}

function Metric({
  icon: Icon,
  iconClass,
  label,
  children,
  onOpen,
}: {
  icon: LucideIcon
  iconClass: string
  label: string
  children: React.ReactNode
  onOpen?: () => void
}) {
  return (
    <Panel className="flex min-w-0 flex-col items-stretch gap-1.5 p-2.5 text-center sm:gap-2 sm:p-4">
      <span className="flex items-center gap-1.5 text-left max-[359px]:flex-col max-[359px]:text-center sm:gap-2">
        <span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-full text-primary-foreground sm:size-9', iconClass)}>
          <Icon className="size-4 sm:size-[1.15rem]" aria-hidden="true" />
        </span>
        <span className="min-w-0 text-[10px] font-medium leading-tight text-foreground sm:text-sm">{label}</span>
      </span>
      <div className="flex flex-1 flex-col items-center justify-center gap-0.5">{children}</div>
      {onOpen && (
        <button type="button" onClick={onOpen} className="mx-auto inline-flex items-center gap-0.5 rounded-md text-xs font-medium text-ember-deep sm:text-sm hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
          Voir <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </Panel>
  )
}

function SectionHeader({ id, title, onAll }: { id: string; title: string; onAll: () => void }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 id={id} className="font-serif text-lg font-semibold min-[400px]:text-xl sm:text-2xl">
        {title}
      </h2>
      <button type="button" onClick={onAll} className="inline-flex shrink-0 items-center gap-0.5 rounded-md text-sm text-foreground/80 hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
        Tout voir <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

const pill: Partial<Record<OrderStatus, string>> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  pret: 'Prêt',
}

const rowInfo: Partial<Record<OrderStatus, { label: string; className: string; to: ManagerView }>> = {
  en_attente: { label: 'Encaissement', className: 'text-ember-deep', to: 'caisse' },
  en_cours: { label: 'En cuisine', className: 'text-foreground/75', to: 'cuisine' },
  pret: { label: 'À récupérer', className: 'text-foreground/75', to: 'commandes' },
}

function ago(now: number, then: number) {
  const min = Math.max(0, Math.floor((now - then) / 60_000))
  if (min < 1) return 'À l’instant'
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return `Il y a ${h} h${m ? ` ${String(m).padStart(2, '0')}` : ''}`
}

const tableText = (table: string) => (/^\d+$/.test(table) ? `Table ${table.padStart(2, '0')}` : table)

function Thumb({ src, className }: { src?: string; className?: string }) {
  return src ? (
    <Photo src={src} className={className} sizes="(min-width: 1024px) 200px, 128px" />
  ) : (
    <span className={cn('flex items-center justify-center bg-sand text-terracotta/60', className)} aria-hidden="true">
      <UtensilsCrossed className="size-7" />
    </span>
  )
}

export function DashboardScreen({
  orders,
  dishes,
  tables,
  sales,
  firstName,
  canViewReports,
  onNavigate,
}: {
  orders: StoreOrder[]
  dishes: MenuDish[]
  tables: RestaurantTable[]
  sales: ReturnType<typeof todayStats>
  firstName: string
  canViewReports: boolean
  onNavigate: (view: ManagerView) => void
}) {
  const now = useNow()
  const image = (id: string) => dishes.find((d) => d.id === id)?.image

  const pending = orders.filter((o) => o.status === 'en_attente')
  const active = orders.filter((o) => o.status === 'en_attente' || o.status === 'en_cours' || o.status === 'pret').filter(isOpen)
  const toHandle = [...active].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3)

  const occupied = tables.filter((t) => t.status === 'occupee').length
  const occupancy = tables.length ? Math.round((occupied / tables.length) * 100) : 0

  // Plats les plus commandés aujourd'hui (nombre de commandes qui contiennent le plat).
  const startOfToday = new Date(now).setHours(0, 0, 0, 0)
  const counts = new Map<string, { id: string; name: string; orders: number }>()
  for (const o of orders) {
    if (o.status === 'annulee' || o.createdAt < startOfToday) continue
    for (const l of o.lines) {
      const entry = counts.get(l.id) ?? { id: l.id, name: l.name, orders: 0 }
      entry.orders += 1
      counts.set(l.id, entry)
    }
  }
  const category = (id: string) => dishes.find((d) => d.id === id)?.category
  const ranked = [...counts.values()].sort((a, b) => b.orders - a.orders)
  const popular = [...ranked.filter((d) => category(d.id) === 'plats'), ...ranked.filter((d) => category(d.id) !== 'plats')].slice(0, 3)

  return (
    <>
      {/* En-tête : marque + notifications (la marque est déjà dans le menu latéral sur grand écran) */}
      <div className="flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2 text-gold">
          <BrandMark className="size-10" />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-3xl font-semibold text-foreground">
              Resto<span className="text-foreground">Ben</span>
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.35em] text-ember-deep">Manager</span>
          </span>
        </div>
        <button type="button" onClick={() => onNavigate('commandes')} aria-label={`Notifications, ${pending.length} nouvelles`} className="relative inline-flex size-11 items-center justify-center rounded-full text-foreground hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
          <Bell className="size-7" strokeWidth={1.6} aria-hidden="true" />
          {pending.length > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-ember-deep ring-2 ring-background" />}
        </button>
      </div>

      <header className="mt-4 lg:mt-0">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Bonjour, {firstName}</h1>
        <p className="mt-1 text-muted-foreground">Gérez votre restaurant, inspirez votre équipe.</p>
      </header>

      {/* Ventes du jour */}
      <section aria-labelledby="sales-title" className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)] sm:p-5">
        <Waves />
        <div className="relative min-h-[8.75rem] sm:min-h-[10rem]">
          <h2 id="sales-title" className="text-sm font-medium text-foreground">
            Ventes aujourd’hui
          </h2>
          <p className="mt-2 whitespace-nowrap font-serif text-[2.1rem] font-semibold leading-none tabular-nums text-foreground min-[380px]:text-[2.6rem] sm:text-6xl">
            {amount(sales.revenue)} <span className="text-xl font-medium min-[380px]:text-2xl sm:text-3xl">FCFA</span>
          </p>
          <p className="mt-3">
            <Dots delta={sales.change} />
          </p>
          <div className="pointer-events-none absolute bottom-6 right-0 top-8 w-[52%] sm:w-[56%]">
            <SalesChart points={sales.points} />
          </div>
          <p className="absolute bottom-0 right-0 text-sm text-foreground/75">08:00 – 21:00</p>
        </div>
      </section>

      {/* Indicateurs */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Metric icon={ClipboardList} iconClass="bg-ember-deep" label="Commandes en cours" onOpen={() => onNavigate('commandes')}>
          <span className="font-serif text-4xl font-semibold leading-none tabular-nums sm:text-5xl">{active.length}</span>
        </Metric>
        <Metric icon={LayoutGrid} iconClass="bg-[#b8862f]" label="Tables occupées" onOpen={() => onNavigate('tables')}>
          <span className="font-serif text-4xl font-semibold leading-none tabular-nums sm:text-5xl">
            {occupied}
            <span className="text-xl text-foreground/70 sm:text-2xl">/{tables.length}</span>
          </span>
          <span className="text-[11px] text-foreground/75 sm:text-xs">{occupancy}% d’occupation</span>
        </Metric>
        <Metric icon={ShoppingCart} iconClass="bg-ember-deep" label="Panier moyen" onOpen={canViewReports ? () => onNavigate('rapports') : undefined}>
          <span className="whitespace-nowrap font-serif text-[1.2rem] font-semibold leading-none tabular-nums sm:text-4xl">
            {amount(sales.average)} <span className="text-[10px] font-medium sm:text-xl">FCFA</span>
          </span>
          <Dots delta={sales.averageChange} />
        </Metric>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        {/* À traiter maintenant */}
        <section aria-labelledby="todo-title" className="min-w-0">
          <SectionHeader id="todo-title" title="À traiter maintenant" onAll={() => onNavigate('commandes')} />
          {toHandle.length === 0 ? (
            <Panel className="text-center text-sm text-muted-foreground">Aucune commande à traiter pour le moment.</Panel>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {toHandle.map((o) => {
                const info = rowInfo[o.status]!
                const names = o.lines.map((l) => l.name).slice(0, 2).join(' + ')
                return (
                  <li key={o.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onNavigate(info.to)}
                      className="flex w-full min-w-0 items-stretch gap-2.5 overflow-hidden rounded-2xl border border-border bg-card pr-2.5 text-left sm:gap-3 sm:pr-3 shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)] transition-colors hover:border-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
                    >
                      <Thumb src={image(o.lines[0]?.id ?? '')} className="w-[4.25rem] shrink-0 self-stretch min-[400px]:w-[4.75rem] sm:w-24" />
                      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2">
                        <span className="line-clamp-2 break-words text-[13px] font-semibold leading-snug sm:text-base">
                          #{o.number} <span className="ml-0.5">{names}</span>
                        </span>
                        <span>
                          <span className="inline-flex rounded-md bg-ember-deep px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">{pill[o.status]}</span>
                        </span>
                        <span className="flex items-center gap-2 whitespace-nowrap text-[11px] text-foreground/75 sm:gap-3 sm:text-xs">
                          <span>{ago(now, o.createdAt)}</span>
                          <span className="inline-flex items-center gap-1">
                            <User className="size-3.5" aria-hidden="true" />
                            {tableText(o.table)}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end justify-center text-right">
                        <span className="whitespace-nowrap text-[13px] font-semibold tabular-nums sm:text-base">{fcfa(o.total)}</span>
                        <span className={cn('whitespace-nowrap text-xs sm:text-sm', info.className)}>{info.label}</span>
                      </span>
                      <ChevronRight className="my-auto size-4 shrink-0 text-foreground/70 sm:size-5" aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Plats populaires */}
        <section aria-labelledby="popular-title" className="min-w-0">
          <SectionHeader id="popular-title" title="Plats populaires aujourd’hui" onAll={() => onNavigate('menu')} />
          {popular.length === 0 ? (
            <Panel className="text-center text-sm text-muted-foreground">Pas encore de commande aujourd’hui.</Panel>
          ) : (
            <ul className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {popular.map((d) => (
                <li key={d.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]">
                  <Thumb src={image(d.id)} className="h-20 w-full sm:h-24" />
                  <div className="p-2 sm:p-2.5">
                    <p className="truncate text-[11px] font-semibold min-[400px]:text-xs sm:text-sm">{d.name}</p>
                    <p className="mt-0.5 flex items-start gap-1 text-[10px] text-foreground/80 min-[400px]:text-[11px] sm:text-xs">
                      <Star className="mt-px size-3 shrink-0 fill-gold text-gold sm:size-3.5" aria-hidden="true" />
                      <span className="leading-tight">
                        {d.orders} commande{d.orders > 1 ? 's' : ''}
                      </span>
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
