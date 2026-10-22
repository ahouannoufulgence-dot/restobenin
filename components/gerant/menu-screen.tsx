'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Search, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa, type Dish } from '@/lib/gerant-data'
import { Panel, ScreenHeader, primaryAction } from './shared'

const fieldClass =
  'h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ember focus:ring-3 focus:ring-ember/20'

export function MenuScreen({
  dishes,
  onToggle,
  onAdd,
}: {
  dishes: Dish[]
  onToggle: (id: string) => void
  onAdd: (name: string, price: number) => void
}) {
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  const visible = dishes.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(price)
    if (!name.trim()) return setError('Indiquez le nom du plat.')
    if (!Number.isInteger(value) || value <= 0) return setError('Indiquez un prix valide en FCFA.')
    onAdd(name.trim(), value)
    setName('')
    setPrice('')
    setError('')
    setAdding(false)
  }

  return (
    <>
      <ScreenHeader title="Menu" subtitle={`${dishes.filter((d) => d.available).length} plats disponibles sur ${dishes.length}`} />

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="dish-search" className="sr-only">
          Rechercher un plat
        </label>
        <input
          id="dish-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un plat"
          className={cn(fieldClass, 'bg-card pl-10')}
        />
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {visible.map((dish) => (
          <li key={dish.id}>
            <Panel className="flex items-center gap-4 p-3 sm:p-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                {dish.image ? (
                  <Image src={dish.image} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <UtensilsCrossed className="absolute inset-0 m-auto size-6 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{dish.name}</p>
                <p className="text-sm tabular-nums text-foreground/80">{fcfa(dish.price)}</p>
                <p className={cn('text-xs font-medium', dish.available ? 'text-success' : 'text-muted-foreground')}>
                  {dish.available ? 'Disponible' : 'Indisponible'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={dish.available}
                aria-label={`Disponibilité de ${dish.name}`}
                onClick={() => onToggle(dish.id)}
                className={cn(
                  'relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30',
                  dish.available ? 'bg-success' : 'bg-foreground/20',
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform',
                    dish.available && 'translate-x-5',
                  )}
                />
              </button>
            </Panel>
          </li>
        ))}
      </ul>

      {adding ? (
        <Panel className="mt-6">
          <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <label htmlFor="dish-name" className="mb-1 block text-sm font-medium">
                Nom du plat
              </label>
              <input id="dish-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Amiwo au poulet" className={fieldClass} />
            </div>
            <div className="sm:w-40">
              <label htmlFor="dish-price" className="mb-1 block text-sm font-medium">
                Prix (FCFA)
              </label>
              <input id="dish-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="3000" className={fieldClass} />
            </div>
            <div className="flex gap-2 sm:pt-6">
              <button type="submit" className={cn(primaryAction, 'h-11 flex-1')}>
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false)
                  setError('')
                }}
                className="h-11 rounded-xl border border-border px-4 text-sm font-semibold hover:border-ember hover:text-ember"
              >
                Annuler
              </button>
            </div>
          </form>
          {error && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </Panel>
      ) : (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={() => setAdding(true)} className={cn(primaryAction, 'w-full sm:w-auto')}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter un plat
          </button>
        </div>
      )}
    </>
  )
}
