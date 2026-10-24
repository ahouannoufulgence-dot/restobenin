import { BarChart3, ChefHat, ClipboardList, Flame, House, LayoutGrid, MoreHorizontal, ScanLine, UtensilsCrossed, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { manager, type ManagerView } from '@/lib/gerant-data'

type NavItem = { view: ManagerView; label: string; icon: LucideIcon }

const home: NavItem = { view: 'accueil', label: 'Tableau de bord', icon: House }
const orders: NavItem = { view: 'commandes', label: 'Commandes', icon: ClipboardList }
const more: NavItem = { view: 'plus', label: 'Plus', icon: MoreHorizontal }

/** Téléphone : deux onglets, le bouton central « Nouvelle commande », puis deux onglets. */
const mobileLeft: NavItem[] = [home, orders]
const mobileRightManager: NavItem[] = [{ view: 'rapports', label: 'Rapports', icon: BarChart3 }, more]
const mobileRightStaff: NavItem[] = [{ view: 'cuisine', label: 'Cuisine', icon: ChefHat }, more]

const desktopItems: NavItem[] = [
  { view: 'accueil', label: 'Tableau de bord', icon: House },
  { view: 'commandes', label: 'Commandes', icon: ClipboardList },
  { view: 'cuisine', label: 'Cuisine', icon: ChefHat },
  { view: 'caisse', label: 'Caisse', icon: Wallet },
  { view: 'tables', label: 'Tables', icon: LayoutGrid },
  { view: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { view: 'rapports', label: 'Rapports', icon: BarChart3 },
  { view: 'plus', label: 'Modules', icon: MoreHorizontal },
]

type NavProps = { current: ManagerView; onNavigate: (view: ManagerView) => void; badges?: Partial<Record<ManagerView, number>> }

export function BottomNav({ current, onNavigate, badges, isManager = true, onNewOrder }: NavProps & { isManager?: boolean; onNewOrder: () => void }) {
  const right = isManager ? mobileRightManager : mobileRightStaff
  const items = [...mobileLeft, ...right]
  const active = items.some((i) => i.view === current) ? current : 'plus'

  const tab = ({ view, label, icon: Icon }: NavItem) => {
    const isActive = active === view
    const badge = badges?.[view]
    return (
      <li key={view} className="flex-1">
        <button
          type="button"
          onClick={() => onNavigate(view)}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'relative flex w-full flex-col items-center justify-end gap-1 px-0.5 pb-2 pt-2.5 text-center text-[10px] font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ember/30',
            isActive ? 'text-ember-deep' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-6" strokeWidth={isActive ? 2.25 : 1.6} aria-hidden="true" />
          {label}
          {badge ? (
            <span className="absolute top-1.5 left-1/2 ml-2 rounded-full bg-ember px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground">{badge}</span>
          ) : null}
        </button>
      </li>
    )
  }

  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-2 bottom-2 z-30 rounded-3xl border border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-12px_rgba(74,36,14,0.35)] backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-xl items-end justify-between px-1">
        {mobileLeft.map(tab)}
        <li className="flex-1">
          <button
            type="button"
            onClick={onNewOrder}
            className="flex w-full flex-col items-center gap-1 px-0.5 pb-2 text-center text-[10px] font-medium leading-tight text-foreground focus-visible:outline-none"
          >
            <span className="-mt-6 inline-flex size-14 items-center justify-center rounded-full bg-ember-deep text-white shadow-lg shadow-ember-deep/40 ring-4 ring-card transition-transform active:scale-95">
              <ScanLine className="size-7" strokeWidth={1.8} aria-hidden="true" />
            </span>
            Nouvelle commande
          </button>
        </li>
        {right.map(tab)}
      </ul>
    </nav>
  )
}

export function Sidebar({ current, onNavigate, badges, restaurantName, hidden = [] }: NavProps & { restaurantName: string; hidden?: ManagerView[] }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-[linear-gradient(180deg,#7a2e12_0%,#4a1c0b_100%)] px-5 py-7 text-cream lg:flex">
      <a href="/" className="flex items-center gap-2.5 px-2" aria-label="RestoBen, retour au site">
        <Flame className="size-8 fill-ember/40 text-ember" strokeWidth={1.75} aria-hidden="true" />
        <span className="flex flex-col leading-none">
          <span className="font-serif text-2xl font-semibold">
            Resto<span className="text-ember">Ben</span>
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cream/60">Manager</span>
        </span>
      </a>

      <nav aria-label="Navigation principale" className="mt-10">
        <ul className="flex flex-col gap-1">
          {desktopItems.filter((i) => !hidden.includes(i.view)).map(({ view, label, icon: Icon }) => {
            const isActive = current === view
            const badge = badges?.[view]
            return (
              <li key={view}>
                <button
                  type="button"
                  onClick={() => onNavigate(view)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40',
                    isActive ? 'bg-cream text-terracotta shadow-sm' : 'text-cream/80 hover:bg-cream/10 hover:text-cream',
                  )}
                >
                  <Icon className={cn('size-5', isActive && 'text-ember')} aria-hidden="true" />
                  <span className="flex-1 text-left">{label}</span>
                  {badge ? (
                    <span className="rounded-full bg-ember px-2 text-xs font-semibold leading-5 text-primary-foreground">{badge}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto rounded-xl border border-cream/15 bg-cream/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-cream/50">Établissement</p>
        <p className="mt-1 font-serif text-lg font-semibold">{restaurantName}</p>
        <p className="text-sm text-cream/70">{manager.city} · Formule Standard</p>
      </div>
    </aside>
  )
}
