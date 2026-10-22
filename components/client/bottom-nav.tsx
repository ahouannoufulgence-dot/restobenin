import { ReceiptText, ShoppingBag, UtensilsCrossed } from 'lucide-react'
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
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="grid grid-cols-3">
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
