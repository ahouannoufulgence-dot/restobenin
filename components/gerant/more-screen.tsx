'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { BarChart3, ChevronRight, CircleHelp, CreditCard, LayoutGrid, LogOut, Package, QrCode, Settings, Store, UtensilsCrossed, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import { fcfa, stock, type ManagerView } from '@/lib/gerant-data'
import { Panel, ScreenHeader } from './shared'

type Module = { label: string; description: string; icon: LucideIcon; badge?: string; action?: 'stock' | ManagerView; managerOnly?: boolean }

const modules: Module[] = [
  { label: 'Rapports', description: 'Ventes par jour, semaine, mois, année + export PDF', icon: BarChart3, action: 'rapports', managerOnly: true },
  { label: 'Tables', description: 'Plan de salle et occupation', icon: LayoutGrid, action: 'tables' },
  { label: 'Menu', description: 'Plats, prix et photos', icon: UtensilsCrossed, action: 'menu' },
  { label: 'Employés', description: 'Équipe, rôles et accès à l’application', icon: Users, action: 'employes', managerOnly: true },
  { label: 'Stock', description: 'Gestion avancée des stocks', icon: Package, badge: `${stock.alerts} alertes`, action: 'stock' },
  { label: 'Paramètres restaurant', description: 'Restaurant, reçus, adresse du site, QR codes', icon: Store, action: 'parametres', managerOnly: true },
  { label: 'QR Code', description: 'Gérer les QR codes de table', icon: QrCode, action: 'qr', managerOnly: true },
  { label: 'Abonnement', description: 'Votre formule et facturation', icon: CreditCard, managerOnly: true },
  { label: 'Aide', description: 'Centre d’aide et tutoriels', icon: CircleHelp },
]

function StockCard({ cardRef }: { cardRef: React.Ref<HTMLElement> }) {
  return (
    <section ref={cardRef} tabIndex={-1} aria-labelledby="stock-title" className="scroll-mt-6 outline-none">
      <Panel className="h-full">
        <div className="flex items-center justify-between">
          <h2 id="stock-title" className="font-serif text-xl font-semibold">
            Stock – Gestion avancée
          </h2>
          <span className="rounded-full bg-ember px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">{stock.alerts} alertes</span>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">Niveau actuel</p>
        <p className="font-serif text-3xl font-semibold">{stock.items} articles</p>

        <dl className="mt-4 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-background text-center">
          <div className="p-3">
            <dt className="text-xs text-muted-foreground">Stock faible</dt>
            <dd className="mt-1 text-sm font-semibold text-ember-deep">{stock.low} articles</dd>
          </div>
          <div className="p-3">
            <dt className="text-xs text-muted-foreground">Seuil d&apos;alerte</dt>
            <dd className="mt-1 text-sm font-semibold">{stock.threshold} articles</dd>
          </div>
          <div className="p-3">
            <dt className="text-xs text-muted-foreground">Valeur totale</dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums">{fcfa(stock.value)}</dd>
          </div>
        </dl>

        <h3 className="mt-5 text-sm font-semibold">Mouvements récents</h3>
        <ul className="mt-2 divide-y divide-border">
          {stock.movements.map((m) => (
            <li key={m.label} className="flex items-center justify-between py-2.5">
              <span>
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block text-xs text-muted-foreground">{m.when}</span>
              </span>
              <span className={cn('text-sm font-semibold tabular-nums', m.direction === 'in' ? 'text-success' : 'text-destructive')}>{m.qty}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  )
}

export function MoreScreen({ onNavigate, isManager = true }: { onNavigate: (view: ManagerView) => void; isManager?: boolean }) {
  const stockRef = useRef<HTMLElement>(null)

  function handle(action: Module['action']) {
    if (action === 'stock') {
      stockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      stockRef.current?.focus({ preventScroll: true })
    } else if (action) {
      onNavigate(action)
    }
  }

  return (
    <>
      <ScreenHeader
        title="Plus"
        subtitle="Tous les modules de votre restaurant."
        actions={
          <span className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card" aria-hidden="true">
            <Settings className="size-5" />
          </span>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel className="p-2 sm:p-2">
          <ul className="divide-y divide-border">
            {modules.filter((m) => isManager || !m.managerOnly).map(({ label, description, icon: Icon, badge, action }) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => handle(action)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/25"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-ember/10 text-ember">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{description}</span>
                  </span>
                  {badge && <span className="rounded-full bg-ember px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{badge}</span>}
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
            <li>
              <Link
                href="/connexion"
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/8 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/25"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-destructive/10">
                  <LogOut className="size-5" aria-hidden="true" />
                </span>
                Déconnexion
              </Link>
            </li>
          </ul>
        </Panel>

        <StockCard cardRef={stockRef} />
      </div>
    </>
  )
}
