import { BarChart3, ChefHat, ClipboardList, Flame, House, LayoutGrid, MoreHorizontal, ScanLine, User, UtensilsCrossed, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { manager, type ManagerView } from '@/lib/gerant-data'

type NavItem = { view: ManagerView; label: string; icon: LucideIcon }

const desktopItems: NavItem[] = [
  { view: 'accueil', label: 'Accueil', icon: House },
  { view: 'commandes', label: 'Commandes', icon: ClipboardList },
  { view: 'cuisine', label: 'Cuisine', icon: ChefHat },
  { view: 'caisse', label: 'Caisse', icon: Wallet },
  { view: 'tables', label: 'Tables', icon: LayoutGrid },
  { view: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { view: 'rapports', label: 'Rapports', icon: BarChart3 },
  { view: 'plus', label: 'Modules', icon: MoreHorizontal },
]

type NavProps = { current: ManagerView; onNavigate: (view: ManagerView) => void; badges?: Partial<Record<ManagerView, number>> }

type BottomNavProps = NavProps & { isManager?: boolean; onNewOrder: () => void }

export function BottomNav({ current, onNavigate, badges, isManager = true, onNewOrder }: BottomNavProps) {
  // Un employé n'a pas accès aux rapports : la cuisine prend leur place.
  const left: NavItem[] = [
    { view: 'accueil', label: 'Tableau de bord', icon: House },
    { view: 'commandes', label: 'Commandes', icon: ClipboardList },
  ]
  const right: NavItem[] = [
    isManager ? { view: 'rapports', label: 'Rapports', icon: BarChart3 } : { view: 'cuisine', label: 'Cuisine', icon: ChefHat },
    { view: 'plus', label: 'Plus', icon: User },
  ]
  const known = [...left, ...right].map((i) => i.view)
  const active = known.includes(current) ? current : 'plus'

  const renderItem = ({ view, label, icon: Icon }: NavItem) => {
    const isActive = active === view
    const badge = badges?.[view]
    return (
      <li key={view} className="flex-1">
        <button
          type="button"
          onClick={() => onNavigate(view)}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'relative flex w-full flex-col items-center gap-1 rounded-2xl px-1 pb-2 pt-2.5 text-[11px] font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ember/30',
            isActive ? 'text-ember-deep' : 'text-[#8a7662] hover:text-foreground',
          )}
        >
          <Icon className={cn('size-6', isActive && 'fill-ember-deep/90')} strokeWidth={isActive ? 2 : 1.75} aria-hidden="true" />
          <span className="text-center">{label}</span>
          {badge ? (
            <span className="absolute top-1.5 left-1/2 ml-2 rounded-full bg-ember px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground">{badge}</span>
          ) : null}
        </button>
      </li>
    )
  }

  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <ul className="mx-auto flex max-w-xl items-end justify-between rounded-[1.75rem] border border-border bg-card/95 px-2 shadow-[0_-8px_30px_-12px_rgba(74,36,14,0.35)] backdrop-blur">
        {left.map(renderItem)}
        <li className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={onNewOrder}
            className="-mt-6 flex w-full flex-col items-center gap-1 pb-2 text-[11px] font-medium leading-tight text-foreground focus-visible:outline-none"
          >
            <span className="inline-flex size-16 items-center justify-center rounded-full bg-gradient-to-b from-ember to-ember-deep text-primary-foreground shadow-lg shadow-ember-deep/40 ring-4 ring-card">
              <ScanLine className="size-8" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="max-w-[4.5rem] text-center">Nouvelle commande</span>
          </button>
        </li>
        {right.map(renderItem)}
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
