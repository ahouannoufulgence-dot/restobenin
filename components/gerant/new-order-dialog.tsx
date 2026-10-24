'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { fcfa } from '@/lib/gerant-data'
import type { MenuDish } from '@/lib/menu-store'
import type { OrderLine } from '@/lib/client-data'
import { QtyStepper } from '@/components/client/ui'
import { Dialog } from './dialog'
import { primaryAction } from './shared'

/** Prise de commande par le personnel : au comptoir ou à une table. La commande part tout de suite en cuisine. */
export function NewOrderDialog({
  dishes,
  tables,
  onCreate,
  onClose,
}: {
  dishes: MenuDish[]
  /** Numéros de table proposés (en plus du comptoir). */
  tables: string[]
  onCreate: (table: string, lines: OrderLine[]) => void
  onClose: () => void
}) {
  const [qty, setQty] = useState<Record<string, number>>({})
  const [table, setTable] = useState('Comptoir')
  const available = dishes.filter((d) => d.available)
  const chosen = available.filter((d) => (qty[d.id] ?? 0) > 0)
  const total = chosen.reduce((s, d) => s + d.price * qty[d.id], 0)

  return (
    <Dialog title="Nouvelle commande" onClose={onClose}>
      {tables.length > 0 && (
        <div className="mb-4">
          <label htmlFor="new-order-table" className="mb-1 block text-sm font-medium">
            Pour
          </label>
          <select
            id="new-order-table"
            value={table}
            onChange={(e) => setTable(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-ember focus:ring-3 focus:ring-ember/20"
          >
            <option value="Comptoir">Vente au comptoir</option>
            {tables.map((t) => (
              <option key={t} value={t}>
                Table {t}
              </option>
            ))}
          </select>
        </div>
      )}

      <ul className="divide-y divide-border">
        {available.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{d.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{fcfa(d.price)}</span>
            </span>
            <QtyStepper qty={qty[d.id] ?? 0} onChange={(n) => setQty((q) => ({ ...q, [d.id]: n }))} name={d.name} size="sm" />
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={chosen.length === 0}
        onClick={() => onCreate(table, chosen.map((d) => ({ id: d.id, name: d.name, qty: qty[d.id], price: d.price })))}
        className={cn(primaryAction, 'mt-5 w-full disabled:opacity-50')}
      >
        {chosen.length === 0 ? 'Choisissez au moins un plat' : `Envoyer en cuisine · ${fcfa(total)}`}
      </button>
      <p className="mt-2 text-xs text-muted-foreground">La commande part en cuisine et apparaît dans la liste des commandes et en caisse.</p>
    </Dialog>
  )
}
