import Image from 'next/image'
import { GlassWater, Minus, Plus, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientDish } from '@/lib/client-data'

export const greenAction =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-success px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-success/25 transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-success/40 disabled:pointer-events-none disabled:opacity-50'

export const emberAction =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ember px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-ember/25 transition-colors hover:bg-ember-deep focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/35'

export const outlineAction =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30'

export const roundButton =
  'inline-flex size-10 items-center justify-center rounded-full bg-card text-foreground shadow-md shadow-black/10 transition-colors hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/35'

export function DishImage({ dish, sizes, className }: { dish: ClientDish; sizes: string; className?: string }) {
  if (dish.image) {
    return (
      <div className={cn('relative overflow-hidden bg-sand', className)}>
        <Image src={dish.image} alt={dish.name} fill sizes={sizes} className="object-cover" />
      </div>
    )
  }
  return (
    <div className={cn('flex items-center justify-center bg-sand text-ember-deep/60', className)} role="img" aria-label={dish.name}>
      <GlassWater className="size-1/3" strokeWidth={1.5} aria-hidden="true" />
    </div>
  )
}

export function Rating({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
      <span className="font-semibold text-foreground">{rating.toFixed(1).replace('.', ',')}</span>
      {count !== undefined && <span>({count} avis)</span>}
    </span>
  )
}

export function QtyStepper({
  qty,
  onChange,
  name,
  min = 0,
  size = 'md',
}: {
  qty: number
  onChange: (qty: number) => void
  name: string
  min?: number
  size?: 'sm' | 'md'
}) {
  const btn = cn(
    'inline-flex items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30',
    size === 'sm' ? 'size-8' : 'size-10',
  )
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={`Quantité de ${name}`}>
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, qty - 1))} aria-label={`Retirer un ${name}`}>
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="min-w-5 text-center font-semibold tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button type="button" className={btn} onClick={() => onChange(qty + 1)} aria-label={`Ajouter un ${name}`}>
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
