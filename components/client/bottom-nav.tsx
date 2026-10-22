import { Flame, ReceiptText, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ClientTab = 'menu' | 'panier' | 'suivi'

const tabs: { id: ClientTab; label: string; icon: LucideIcon }[] = [
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'panier', label: 'Panier', icon: ShoppingBag },
  { id: 'suivi', label: 'Ma commande', icon: ReceiptText },
]

export function BottomNav({ current, onNavigate, cartCount, hasOrder }: { current: ClientTab | null; onNavigate: (t: ClientTab) => void; cartCount: number; hasOrder: boolean }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = current === id
          const badge = id === 'panier' ? cartCount : id === 'suivi' && hasOrder ? 1 : 0
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex w-full flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:text-ember',
                  active ? 'text-ember' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden="true" />
                  {badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                      {id === 'suivi' ? '•' : badge}
                    </span>
                  )}
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function TopNav({
  current,
  onNavigate,
  cartCount,
  hasOrder,
  restaurant,
  table,
}: {
  current: ClientTab | null
  onNavigate: (t: ClientTab) => void
  cartCount: number
  hasOrder: boolean
  restaurant: string
  table: string
}) {
  const items: { id: ClientTab; label: string; icon: LucideIcon }[] = [
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'suivi', label: 'Ma commande', icon: ReceiptText },
  ]
  return (
    <header className="sticky top-0 z-30 hidden h-16 border-b border-border bg-background/95 backdrop-blur lg:block">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6 px-8">
        <div className="flex items-center gap-3">
          <Flame className="size-7 fill-ember/30 text-ember" strokeWidth={1.75} aria-hidden="true" />
          <span className="font-serif text-2xl font-semibold">
            Resto<span className="text-ember">Ben</span>
          </span>
          <span className="ml-2 border-l border-border pl-4 text-sm text-muted-foreground">
            {restaurant} · Table {table}
          </span>
        </div>
        <nav aria-label="Navigation principale" className="flex items-center gap-2">
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={current === id ? 'page' : undefined}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30',
                current === id ? 'bg-ember/10 text-ember' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
              {id === 'suivi' && hasOrder && <span className="size-2 rounded-full bg-ember" aria-label="Commande en cours" />}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onNavigate('panier')}
            aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}
            aria-current={current === 'panier' ? 'page' : undefined}
            className="relative ml-2 inline-flex size-10 items-center justify-center rounded-full border border-border bg-card transition-colors hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-ember text-[11px] font-semibold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  )
}
