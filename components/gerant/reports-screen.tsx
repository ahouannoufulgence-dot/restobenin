'use client'

import { useState } from 'react'
import { CalendarDays, ChevronDown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa, weeklyReport as r } from '@/lib/gerant-data'
import { Panel, ScreenHeader, Trend } from './shared'

function BarChart() {
  const max = 500000
  return (
    <div>
      <div className="flex h-48 items-end gap-2 sm:gap-4" role="img" aria-label={`Ventes par jour : ${r.days.map((d) => `${d.day} ${fcfa(d.value)}`).join(', ')}`}>
        {r.days.map((d) => (
          <div key={d.day} className="flex h-full flex-1 flex-col justify-end">
            <div
              className="w-full rounded-t-md bg-[linear-gradient(180deg,var(--ember)_0%,var(--ember-deep)_100%)]"
              style={{ height: `${(d.value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-4">
        {r.days.map((d) => (
          <span key={d.day} className="flex-1 text-center text-xs text-muted-foreground">
            {d.day}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ReportsScreen() {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <ScreenHeader
        title="Rapports"
        subtitle="Vos performances de la semaine."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium">
            <CalendarDays className="size-4 text-ember" aria-hidden="true" />
            {r.range}
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel>
          <p className="text-sm text-muted-foreground">Chiffre d&apos;affaires</p>
          <p className="mt-1 font-serif text-4xl font-semibold tabular-nums">{fcfa(r.revenue)}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Trend value={r.revenueChange} /> vs période précédente
          </p>
        </Panel>
        <Panel>
          <p className="text-sm text-muted-foreground">Commandes</p>
          <p className="mt-1 font-serif text-4xl font-semibold tabular-nums">{r.orders}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Trend value={r.ordersChange} /> vs période précédente
          </p>
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="mb-4 font-serif text-xl font-semibold">Ventes par jour</h2>
        <BarChart />
      </Panel>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Panel className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Satisfaction</p>
          <p className="mt-1 text-xl font-semibold">{r.satisfaction}/5</p>
          <div className="mt-1 flex gap-0.5" aria-label={`${r.satisfaction} étoiles sur 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn('size-3.5', i < Math.round(r.satisfaction) ? 'fill-gold text-gold' : 'text-border')} aria-hidden="true" />
            ))}
          </div>
        </Panel>
        <Panel className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Top plat</p>
          <p className="mt-1 font-semibold leading-tight">{r.topDish.name}</p>
          <p className="text-xs text-muted-foreground">{r.topDish.orders} commandes</p>
        </Panel>
        <Panel className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Panier moyen</p>
          <p className="mt-1 font-semibold tabular-nums">{fcfa(r.averageBasket)}</p>
          <p className="text-xs font-semibold text-success">+{r.basketChange} %</p>
        </Panel>
      </div>

      <Panel className="mt-4 p-0 sm:p-0">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="top-dishes"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold transition-colors hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/25"
        >
          {expanded ? 'Masquer le détail' : 'Voir plus de rapports'}
          <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
        </button>
        {expanded && (
          <div id="top-dishes" className="border-t border-border px-5 py-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Classement des plats</h3>
            <ol className="flex flex-col gap-3">
              {r.topDishes.map((d, i) => (
                <li key={d.name} className="flex items-center gap-3 text-sm">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-ember/12 text-xs font-semibold text-ember">{i + 1}</span>
                  <span className="flex-1 font-medium">{d.name}</span>
                  <span className="text-muted-foreground">{d.orders} cmd.</span>
                  <span className="w-28 text-right font-semibold tabular-nums">{fcfa(d.revenue)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Panel>
    </>
  )
}
