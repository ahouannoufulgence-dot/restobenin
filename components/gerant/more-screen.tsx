'use client'

import Link from 'next/link'
import { BarChart3, ChefHat, ChevronRight, CircleHelp, CreditCard, LayoutGrid, LogOut, Package, QrCode, Settings, Store, UtensilsCrossed, Users, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import type { ManagerView } from '@/lib/gerant-data'
import { summarize, useStock } from '@/lib/stock-store'
import { Panel, ScreenHeader } from './shared'

type Module = { label: string; description: string; icon: LucideIcon; badge?: string; action?: ManagerView }

const modules: Module[] = [
  { label: 'Cuisine', description: 'Préparation des commandes et disponibilité des plats', icon: ChefHat, action: 'cuisine' },
  { label: 'Caisse', description: 'Encaissement, ventes au comptoir et reçus', icon: Wallet, action: 'caisse' },
  { label: 'Rapports', description: 'Ventes par jour, semaine, mois, année + export PDF', icon: BarChart3, action: 'rapports' },
  { label: 'Tables', description: 'Plan de salle et occupation', icon: LayoutGrid, action: 'tables' },
  { label: 'Menu', description: 'Plats, prix et photos', icon: UtensilsCrossed, action: 'menu' },
  { label: 'Employés', description: 'Équipe, rôles et accès à l’application', icon: Users, action: 'employes' },
  { label: 'Stock', description: 'Gestion avancée des stocks', icon: Package, action: 'stock' },
  { label: 'Paramètres restaurant', description: 'Restaurant, reçus, adresse du site, QR codes', icon: Store, action: 'parametres' },
  { label: 'QR Code', description: 'Gérer les QR codes de table', icon: QrCode, action: 'qr' },
  { label: 'Abonnement', description: 'Votre formule et facturation', icon: CreditCard, action: 'abonnement' },
  { label: 'Aide & Support', description: 'FAQ, guide de démarrage et contact du support', icon: CircleHelp, action: 'aide' },
]

export function MoreScreen({ onNavigate, canView = () => true }: { onNavigate: (view: ManagerView) => void; canView?: (view: ManagerView) => boolean }) {
  const alerts = summarize(useStock().items).critical

  function handle(action: Module['action']) {
    if (action) onNavigate(action)
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

      <div className="grid items-start gap-4 lg:max-w-2xl">
        <Panel className="p-2 sm:p-2">
          <ul className="divide-y divide-border">
            {modules.filter((m) => !m.action || canView(m.action)).map(({ label, description, icon: Icon, action }) => {
              const badge = action === 'stock' && alerts > 0 ? `${alerts} alerte${alerts > 1 ? 's' : ''}` : undefined
              return (
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
              )
            })}
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
      </div>
    </>
  )
}
