'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RestaurantTable, TableStatus } from '@/lib/gerant-data'
import { ScreenHeader, primaryAction } from './shared'

const statusMeta: Record<TableStatus, { label: string; className: string; next: TableStatus }> = {
  libre: { label: 'Libre', className: 'bg-success text-white', next: 'occupee' },
  occupee: { label: 'Occupée', className: 'bg-[#b5332a] text-white', next: 'reservee' },
  reservee: { label: 'Réservée', className: 'bg-ember text-white', next: 'libre' },
}

type Filter = 'toutes' | TableStatus

export function TablesScreen({
  tables,
  onCycle,
  onAdd,
  canAdd = true,
}: {
  tables: RestaurantTable[]
  onCycle: (id: string) => void
  onAdd: () => void
  /** false : on ne peut pas ajouter de table (réservé au gérant). */
  canAdd?: boolean
}) {
  const [filter, setFilter] = useState<Filter>('toutes')
  const visible = filter === 'toutes' ? tables : tables.filter((t) => t.status === filter)

  const filters: { id: Filter; label: string }[] = [
    { id: 'toutes', label: `Toutes (${tables.length})` },
    ...(Object.keys(statusMeta) as TableStatus[]).map((s) => ({
      id: s,
      label: `${statusMeta[s].label} (${tables.filter((t) => t.status === s).length})`,
    })),
  ]

  return (
    <>
      <ScreenHeader title="Tables" subtitle="Une table passe en « Occupée » dès qu’une commande est ouverte, et se libère après l’encaissement." />

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrer les tables">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/25',
              filter === f.id ? 'border-ember bg-ember text-primary-foreground' : 'border-border bg-card text-foreground hover:border-ember',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {visible.map((table) => {
          const meta = statusMeta[table.status]
          return (
            <li key={table.id}>
              <button
                type="button"
                onClick={() => onCycle(table.id)}
                aria-label={`${table.id}, ${table.seats} personnes, ${meta.label}. Passer à ${statusMeta[meta.next].label}`}
                className={cn(
                  'flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-2xl shadow-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ember/35',
                  meta.className,
                )}
              >
                <span className="font-serif text-2xl font-semibold">{table.id}</span>
                <span className="text-xs opacity-90">{table.seats} pers.</span>
                <span className="text-xs font-semibold">{meta.label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {canAdd && (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={onAdd} className={cn(primaryAction, 'w-full sm:w-auto')}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter une table
          </button>
        </div>
      )}
    </>
  )
}
