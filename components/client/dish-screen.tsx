import { useState } from 'react'
import { ArrowLeft, ChevronRight, Heart, ShoppingBag, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientDish } from '@/lib/client-data'
import { fcfa } from '@/lib/gerant-data'
import { DishImage, QtyStepper, Rating, greenAction, roundButton } from './ui'

export function DishScreen({
  dish,
  initialQty,
  onBack,
  onAdd,
}: {
  dish: ClientDish
  initialQty: number
  onBack: () => void
  onAdd: (qty: number) => void
}) {
  const [qty, setQty] = useState(Math.max(1, initialQty))
  const [favorite, setFavorite] = useState(false)

  return (
    <div className="pb-28">
      <div className="relative">
        <DishImage dish={dish} sizes="(min-width: 448px) 448px, 100vw" className="h-72 w-full" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button type="button" onClick={onBack} className={roundButton} aria-label="Retour au menu">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setFavorite((f) => !f)} aria-pressed={favorite} className={roundButton} aria-label="Ajouter aux favoris">
            <Heart className={cn('size-5', favorite && 'fill-ember text-ember')} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative -mt-6 rounded-t-3xl bg-background px-5 pt-6">
        <h1 className="font-serif text-3xl font-semibold leading-tight">{dish.name}</h1>
        <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{dish.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <p className="font-serif text-3xl font-semibold tabular-nums text-ember-deep">{fcfa(dish.price)}</p>
          <QtyStepper qty={qty} onChange={setQty} name={dish.name} min={1} />
        </div>

        <section aria-labelledby="reviews-title" className="mt-8">
          <div className="flex items-center justify-between">
            <h2 id="reviews-title" className="font-serif text-xl font-semibold">
              Avis clients
            </h2>
            <Rating rating={dish.rating} count={dish.reviewCount} />
          </div>
          {dish.reviews.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Pas encore d’avis. Soyez le premier à donner le vôtre après votre repas.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {dish.reviews.map((r) => (
                <li key={r.author + r.date} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{r.author}</span>
                    <span className="inline-flex items-center gap-0.5" aria-label={`Note : ${r.rating} sur 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn('size-3.5', i < r.rating ? 'fill-gold text-gold' : 'text-border')} aria-hidden="true" />
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                  <p className="mt-1.5 text-sm leading-relaxed">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <button type="button" onClick={() => onAdd(qty)} disabled={!dish.available} className={greenAction}>
          <ShoppingBag className="size-4" aria-hidden="true" />
          {dish.available ? `Ajouter au panier · ${fcfa(dish.price * qty)}` : 'Indisponible aujourd’hui'}
          {dish.available && <ChevronRight className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
