'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa, type OrderStatus } from '@/lib/gerant-data'
import { tableLabel, type StoreOrder } from '@/lib/orders-store'
import { Panel, ScreenHeader, StatusBadge, iconButton } from './shared'

type Tab = 'en_cours' | 'terminees' | 'annulees'

const tabs: { id: Tab; label: string; statuses: OrderStatus[] }[] = [
  { id: 'en_cours', label: 'En cours', statuses: ['en_attente', 'en_cours', 'pret'] },
  { id: 'terminees', label: 'Terminées', statuses: ['terminee'] },
  { id: 'annulees', label: 'Annulées', statuses: ['annulee'] },
]

const nextStep: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  en_attente: { label: 'Lancer en cuisine', to: 'en_cours' },
  en_cours: { label: 'Marquer prête', to: 'pret' },
  pret: { label: 'Marquer servie', to: 'terminee' },
}

const clock = (ms: number) => new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function OrdersScreen({ orders, onUpdate }: { orders: StoreOrder[]; onUpdate: (id: string, status: OrderStatus) => void }) {
  const [tab, setTab] = useState<Tab>('en_cours')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const current = tabs.find((t) => t.id === tab)!
  const q = query.trim().toLowerCase()
  const visible = orders
    .filter((o) => current.statuses.includes(o.status) && (tableLabel(o.table).toLowerCase().includes(q) || o.number.includes(q)))
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <>
      <ScreenHeader
        title="Commandes"
        subtitle="Suivez chaque table, de la prise de commande au service."
        actions={
          <button
            type="button"
            className={iconButton}
            aria-label={searchOpen ? 'Fermer la recherche' : 'Rechercher une commande'}
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((v) => !v)
              setQuery('')
            }}
          >
            {searchOpen ? <X className="size-5" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
          </button>
        }
      />

      {searchOpen && (
        <div className="mb-4">
          <label htmlFor="order-search" className="sr-only">
            Rechercher par table
          </label>
          <input
            id="order-search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une table ou un n° (ex. Table 12)"
            className="h-11 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ember focus:ring-3 focus:ring-ember/20"
          />
        </div>
      )}

      <div role="tablist" aria-label="Statut des commandes" className="mb-5 flex gap-1 border-b border-border">
        {tabs.map((t) => {
          const count = orders.filter((o) => t.statuses.includes(o.status)).length
          const selected = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/25',
                selected ? 'border-ember text-ember' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              <span className={cn('rounded-full px-1.5 text-xs leading-5', selected ? 'bg-ember/12' : 'bg-muted')}>{count}</span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <Panel className="py-12 text-center text-sm text-muted-foreground">Aucune commande dans cette catégorie.</Panel>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((order) => {
            const step = nextStep[order.status as OrderStatus]
            return (
              <li key={order.id}>
                <Panel className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{tableLabel(order.table)}</p>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        #{order.number} · {clock(order.createdAt)}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">{fcfa(order.total)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.lines.map((l) => `${l.qty} × ${l.name}`).join(', ')}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <StatusBadge status={order.status} />
                      {order.payment ? (
                        <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">Payée</span>
                      ) : (
                        order.status === 'terminee' && <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-[#8a5a12]">À encaisser</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {order.lines.reduce((n, l) => n + l.qty, 0)} article(s)
                    </span>
                  </div>
                  {step && (
                    <div className="mt-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdate(order.id, step.to)}
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-ember/40 text-sm font-semibold text-ember transition-colors hover:bg-ember hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
                      >
                        {step.label}
                      </button>
                      {order.status === 'en_attente' && (
                        <button
                          type="button"
                          onClick={() => onUpdate(order.id, 'annulee')}
                          className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/30"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  )}
                </Panel>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
