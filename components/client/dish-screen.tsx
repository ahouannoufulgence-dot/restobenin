import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, Heart, ShoppingBag, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ClientDish, cartKey, linePrice } from '@/lib/client-data'
import { fcfa } from '@/lib/gerant-data'
import { DishImage, QtyStepper, Rating, greenAction, roundButton } from './ui'

export function DishScreen({
  dish,
  dishes,
  onSelect,
  initialQty,
  onBack,
  onAdd,
  initialVariant,
}: {
  dish: ClientDish
  /** Tous les plats affichés dans le menu : la fiche permet de passer de l'un à l'autre. */
  dishes: ClientDish[]
  onSelect: (id: string) => void
  initialQty: number
  onBack: () => void
  /** Ajoute le plat (et la taille choisie, s'il y en a une) au panier. */
  onAdd: (qty: number, variantId?: string) => void
  /** Taille déjà choisie dans le panier pour ce plat. */
  initialVariant?: string
}) {
  const [qty, setQty] = useState(Math.max(1, initialQty))
  const variants = (dish.variants ?? []).filter((v) => v.available)
  const [variantId, setVariantId] = useState<string | undefined>(initialVariant ?? variants[0]?.id)
  const unitPrice = linePrice(dish, variantId)
  const needsVariant = variants.length > 0 && !variantId
  const [favorite, setFavorite] = useState(false)
  const rail = useRef<HTMLDivElement>(null)
  const index = Math.max(0, dishes.findIndex((d) => d.id === dish.id))

  // Quand on change de plat, la rangée revient sur la carte affichée (et la quantité repart de celle du panier).
  useEffect(() => {
    const el = rail.current?.children[index] as HTMLElement | undefined
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' as ScrollBehavior })
  }, [index])

  return (
    <div className="pb-28 lg:mx-auto lg:grid lg:max-w-5xl lg:grid-cols-2 lg:items-start lg:gap-12 lg:px-0 lg:pb-12 lg:pt-10">
      <div className="relative lg:sticky lg:top-24 lg:overflow-hidden lg:rounded-3xl">
        {/* Rangée des plats : on glisse de gauche à droite pour passer au plat suivant. */}
        <div
          ref={rail}
          role="list"
          aria-label="Parcourir les plats"
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget
            const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
            if (dishes[i] && dishes[i].id !== dish.id) onSelect(dishes[i].id)
          }}
        >
          {dishes.map((d) => (
            <div key={d.id} role="listitem" className="w-full shrink-0 snap-center">
              <DishImage dish={d} sizes="(min-width: 448px) 448px, 100vw" className="h-72 w-full md:h-96 lg:h-[32rem]" />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden="true">
          {dishes.map((d, i) => (
            <span key={d.id} className={cn('h-1.5 rounded-full bg-white/80 transition-all', i === index ? 'w-5' : 'w-1.5 opacity-60')} />
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button type="button" onClick={onBack} className={roundButton} aria-label="Retour au menu">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setFavorite((f) => !f)} aria-pressed={favorite} className={roundButton} aria-label="Ajouter aux favoris">
            <Heart className={cn('size-5', favorite && 'fill-ember text-ember')} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative -mt-6 rounded-t-3xl bg-background px-5 pt-6 md:mx-auto md:max-w-2xl lg:mt-0 lg:max-w-none lg:rounded-none lg:px-0 lg:pt-0">
        <h1 className="font-serif text-3xl font-semibold leading-tight lg:text-5xl">{dish.name}</h1>
        <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{dish.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <p className="font-serif text-3xl font-semibold tabular-nums text-ember-deep">{fcfa(unitPrice)}</p>
          <QtyStepper qty={qty} onChange={setQty} name={dish.name} min={1} />
        </div>

        <section aria-labelledby="reviews-title" className="mt-8">
          <div className="flex items-center justify-between">
            <h2 id="reviews-title" className="font-serif text-xl font-semibold">
              Avis clients
            </h2>
            {dish.reviewCount > 0 && <Rating rating={dish.rating} count={dish.reviewCount} />}
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

        {variants.length > 0 && (
          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-semibold">Choisissez la taille</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {variants.map((v) => {
                const selected = v.id === variantId
                return (
                  <label
                    key={v.id}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-3 text-sm transition-colors focus-within:ring-3 focus-within:ring-ember/30 ${
                      selected ? 'border-ember bg-[#fff3e6] ring-2 ring-ember/30' : 'border-border bg-card hover:border-ember/50'
                    }`}
                  >
                    <input type="radio" name="variant" value={v.id} checked={selected} onChange={() => setVariantId(v.id)} className="sr-only" />
                    <span className="font-semibold">{v.name}</span>
                    <span className="tabular-nums text-ember-deep">{fcfa(v.price)}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        )}

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <button
            type="button"
            onClick={() => onAdd(qty, variantId)}
            disabled={!dish.available || needsVariant}
            className={`${greenAction} md:mx-auto md:max-w-md lg:mx-0`}
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            {!dish.available ? 'Indisponible aujourd’hui' : needsVariant ? 'Choisissez une taille' : `Ajouter au panier · ${fcfa(unitPrice * qty)}`}
            {dish.available && !needsVariant && <ChevronRight className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  )
}
