import { Bell, ChefHat, ChevronRight, ClipboardList, LayoutGrid, PackageCheck, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fcfa, manager, type ManagerView, type RestaurantTable } from '@/lib/gerant-data'
import { tableLabel, type StoreOrder } from '@/lib/orders-store'
import type { todayStats } from '@/lib/reports'
import { Panel, ScreenHeader, StatusBadge, Trend, iconButton } from './shared'

function SalesChart({ points }: { points: number[] }) {
  const max = Math.max(...points, 1)
  const coords = points.map((p, i) => [(i / Math.max(points.length - 1, 1)) * 300, 100 - (p / max) * 88] as const)
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="h-32 w-full" role="img" aria-label="Évolution cumulée des ventes au fil de la journée">
      <defs>
        <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--ember)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L300,100 L0,100 Z`} fill="url(#sales-fill)" />
      <path d={line} fill="none" stroke="var(--ember)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Panel className="flex flex-col gap-2 p-3 sm:p-4">
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-ember/12 text-ember">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="text-xs leading-tight text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums text-foreground sm:text-xl">{value}</span>
    </Panel>
  )
}

const clock = (ms: number) => new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function DashboardScreen({
  orders,
  tables,
  sales,
  restaurantName,
  onNavigate,
}: {
  orders: StoreOrder[]
  tables: RestaurantTable[]
  sales: ReturnType<typeof todayStats>
  restaurantName: string
  onNavigate: (view: ManagerView) => void
}) {
  const pending = orders.filter((o) => o.status === 'en_attente')
  const inProgress = orders.filter((o) => o.status === 'en_cours')
  const ready = orders.filter((o) => o.status === 'pret')
  const occupied = tables.filter((t) => t.status === 'occupee').length
  const active = [...pending, ...inProgress, ...ready]
  const unpaid = orders.filter((o) => !o.payment && o.status !== 'annulee')

  const todo: { label: string; count: number; detail: string; icon: LucideIcon; tone: string; to: ManagerView }[] = [
    { label: 'Nouvelles commandes', count: pending.length, detail: 'en attente', icon: ClipboardList, tone: 'bg-gold/20 text-[#8a5a12]', to: 'commandes' },
    { label: 'Commandes en cours', count: inProgress.length, detail: 'en cuisine', icon: ChefHat, tone: 'bg-ember/12 text-ember-deep', to: 'cuisine' },
    { label: 'Prêtes à servir', count: ready.length, detail: 'prêtes', icon: PackageCheck, tone: 'bg-success/15 text-success', to: 'cuisine' },
    { label: 'À encaisser', count: unpaid.length, detail: 'en attente de paiement', icon: Wallet, tone: 'bg-muted text-foreground', to: 'caisse' },
  ]

  return (
    <>
      <ScreenHeader
        title={`Bonjour, ${manager.firstName}`}
        subtitle={`${restaurantName} · ${manager.city}`}
        actions={
          <button type="button" className={iconButton} aria-label={`Notifications, ${pending.length} nouvelles`} onClick={() => onNavigate('commandes')}>
            <Bell className="size-5" aria-hidden="true" />
            {pending.length > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-ember ring-2 ring-card" />}
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Ventes aujourd&apos;hui</p>
                <p className="mt-1 font-serif text-4xl font-semibold tabular-nums text-foreground">{fcfa(sales.revenue)}</p>
                <p className="text-xs text-muted-foreground">{sales.count} commande{sales.count > 1 ? 's' : ''} encaissée{sales.count > 1 ? 's' : ''}</p>
              </div>
              {sales.change !== null && sales.change >= 0 && <Trend value={sales.change} />}
              {sales.change !== null && sales.change < 0 && (
                <span className="inline-flex items-center rounded-full bg-destructive/12 px-2 py-0.5 text-xs font-semibold text-destructive">{sales.change} %</span>
              )}
            </div>
            <div className="mt-4">
              <SalesChart points={sales.points} />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>08:00</span>
                <span>Maintenant</span>
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-3 gap-3">
            <Metric icon={ClipboardList} label="Commandes en cours" value={String(active.length)} />
            <Metric icon={LayoutGrid} label="Tables occupées" value={`${occupied}/${tables.length}`} />
            <Metric icon={Wallet} label="Panier moyen" value={fcfa(sales.average)} />
          </div>
        </div>

        <section aria-labelledby="todo-title" className="flex flex-col gap-4">
          <Panel>
            <h2 id="todo-title" className="font-serif text-xl font-semibold">
              À traiter maintenant
            </h2>
            <ul className="mt-3 divide-y divide-border">
              {todo.map(({ label, count, detail, icon: Icon, tone, to }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => onNavigate(to)}
                    className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/25"
                  >
                    <span className={`inline-flex size-9 items-center justify-center rounded-lg ${tone}`}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {count} {detail}
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="hidden lg:block">
            <h2 className="font-serif text-xl font-semibold">Dernières commandes</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {active.sort((a, b) => b.createdAt - a.createdAt).slice(0, 4).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    <span className="font-semibold">{tableLabel(o.table)}</span>
                    <span className="ml-2 text-muted-foreground">{clock(o.createdAt)}</span>
                  </span>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>
    </>
  )
}
