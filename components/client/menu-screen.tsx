import { Plus, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categories, type Category, type ClientDish } from '@/lib/client-data'
import { fcfa } from '@/lib/gerant-data'
import { DishImage, QtyStepper, Rating, roundButton } from './ui'

export function MenuScreen({
  restaurantName,
  dishes: allDishes,
  table,
  category,
  onCategory,
  cart,
  cartCount,
  onOpen,
  onSetQty,
  onCart,
}: {
  restaurantName: string
  dishes: ClientDish[]
  table: string
  category: Category | 'tous'
  onCategory: (c: Category | 'tous') => void
  cart: Record<string, number>
  cartCount: number
  onOpen: (id: string) => void
  onSetQty: (id: string, qty: number) => void
  onCart: () => void
}) {
  const dishes = allDishes.filter((d) => category === 'tous' || d.category === category)

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/95 px-4 pb-0 pt-5 backdrop-blur lg:top-16 lg:px-0 lg:pt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold leading-tight lg:text-4xl">{restaurantName}</h1>
            <p className="text-sm text-muted-foreground lg:hidden">Table {table}</p>
            <p className="hidden text-muted-foreground lg:block">Choisissez vos plats, nous les préparons pour votre table.</p>
          </div>
          <button type="button" onClick={onCart} className={cn(roundButton, 'relative lg:hidden')} aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}>
            <ShoppingBag className="size-5" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-ember text-[11px] font-semibold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="mt-4 flex gap-6 overflow-x-auto border-b border-border" role="tablist" aria-label="Catégories du menu">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              onClick={() => onCategory(c.id)}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:text-ember',
                category === c.id ? 'border-ember text-ember' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      {/* Plats en rangée : on fait glisser du doigt de gauche à droite (ou la molette sur ordinateur). */}
      <ul
        aria-label="Plats"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 py-4 scroll-px-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 lg:px-0 lg:scroll-px-0 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {dishes.map((dish) => {
          // Dans la liste, le compteur d'un plat additionne toutes ses tailles.
          const qty = Object.entries(cart).reduce((sum, [key, q]) => (key.split('|')[0] === dish.id ? sum + q : sum), 0)
          return (
            <li
              key={dish.id}
              className="flex w-[78vw] max-w-72 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)] sm:w-64"
            >
              <button
                type="button"
                onClick={() => onOpen(dish.id)}
                className="flex min-w-0 flex-1 flex-col items-stretch rounded-t-2xl text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
              >
                <DishImage
                  dish={dish}
                  sizes="(min-width: 640px) 256px, 78vw"
                  className={cn('aspect-[4/3] w-full rounded-none', !dish.available && 'grayscale')}
                />
                <span className="min-w-0 p-4 pb-2">
                  <span className="block truncate font-semibold text-lg">{dish.name}</span>
                  <span className={cn('mt-0.5 block font-semibold tabular-nums', dish.available ? 'text-ember-deep' : 'text-muted-foreground')}>
                    {dish.variants && dish.variants.length > 0 ? `à partir de ${fcfa(Math.min(...dish.variants.filter((v) => v.available).map((v) => v.price)))}` : fcfa(dish.price)}
                  </span>
                  <span className="mt-1 block">
                    {dish.available ? (
                      dish.reviewCount > 0 ? <Rating rating={dish.rating} count={dish.reviewCount} /> : <span className="text-xs font-semibold text-ember-deep">Nouveau</span>
                    ) : <span className="text-xs font-medium text-muted-foreground">Indisponible aujourd’hui</span>}
                  </span>
                </span>
              </button>

              {dish.available && (
                <div className="flex justify-end px-4 pb-4">
                  {qty > 0 ? (
                    <QtyStepper qty={qty} onChange={(n) => onSetQty(dish.id, n)} name={dish.name} size="sm" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => (dish.variants && dish.variants.length > 0 ? onOpen(dish.id) : onSetQty(dish.id, 1))}
                      aria-label={dish.variants && dish.variants.length > 0 ? `Choisir la taille de ${dish.name}` : `Ajouter ${dish.name} au panier`}
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground shadow-md shadow-success/25 transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-success/40"
                    >
                      <Plus className="size-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
