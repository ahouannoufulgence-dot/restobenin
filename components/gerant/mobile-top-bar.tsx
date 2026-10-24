import { Bell, Flame, Menu } from 'lucide-react'
import type { ManagerView } from '@/lib/gerant-data'

/** Barre du haut sur téléphone : logo RestoBen Manager et cloche des nouvelles commandes. */
export function MobileTopBar({ pending, onNavigate, withMenu = false }: { pending: number; onNavigate: (view: ManagerView) => void; withMenu?: boolean }) {
  const logo = (
    <div className="flex items-center gap-2 text-ember-deep">
      <Flame className="size-8 fill-ember/30 text-ember" strokeWidth={1.6} aria-hidden="true" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-2xl font-semibold">RestoBen</span>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.3em] text-ember">Manager</span>
      </span>
    </div>
  )
  const iconBtn = 'inline-flex size-10 items-center justify-center rounded-full text-foreground hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30'
  return (
    <div className="mb-5 flex items-center justify-between lg:hidden">
      {withMenu ? (
        <button type="button" onClick={() => onNavigate('plus')} aria-label="Ouvrir les modules" className={iconBtn}>
          <Menu className="size-6" aria-hidden="true" />
        </button>
      ) : (
        logo
      )}
      {withMenu && logo}
      <button
        type="button"
        onClick={() => onNavigate('commandes')}
        aria-label={pending > 0 ? `${pending} nouvelle${pending > 1 ? 's' : ''} commande${pending > 1 ? 's' : ''}` : 'Notifications'}
        className={`relative ${iconBtn}`}
      >
        <Bell className="size-6" aria-hidden="true" />
        {pending > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-ember ring-2 ring-background" />}
      </button>
    </div>
  )
}
