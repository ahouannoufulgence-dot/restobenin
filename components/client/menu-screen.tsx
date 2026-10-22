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

      <ul className="flex flex-col gap-3 px-4 py-4 sm:grid sm:grid-cols-2 sm:gap-4 lg:px-0">
        {dishes.map((dish) => {
          const qty = cart[dish.id] ?? 0
          return (
            <li
              key={dish.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)] sm:flex-col sm:items-stretch sm:gap-0 sm:overflow-hidden sm:p-0"
            >
              <button
                type="button"
                onClick={() => onOpen(dish.id)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-none"
              >
                <DishImage
                  dish={dish}
                  sizes="(min-width: 640px) 320px, 80px"
                  className={cn('size-20 shrink-0 rounded-xl sm:aspect-[4/3] sm:size-auto sm:w-full sm:rounded-none', !dish.available && 'grayscale')}
                />
                <span className="min-w-0 sm:p-4 sm:pb-2">
                  <span className="block truncate font-semibold sm:text-lg">{dish.name}</span>
                  <span className={cn('mt-0.5 block font-semibold tabular-nums', dish.available ? 'text-ember-deep' : 'text-muted-foreground')}>
                    {fcfa(dish.price)}
                  </span>
                  <span className="mt-1 block">
                    {dish.available ? (
                      dish.reviewCount > 0 ? <Rating rating={dish.rating} count={dish.reviewCount} /> : <span className="text-xs font-semibold text-ember-deep">Nouveau</span>
                    ) : <span className="text-xs font-medium text-muted-foreground">Indisponible aujourd’hui</span>}
                  </span>
                </span>
              </button>

              {dish.available && (
                <div className="sm:flex sm:justify-end sm:px-4 sm:pb-4">
                  {qty > 0 ? (
                    <QtyStepper qty={qty} onChange={(n) => onSetQty(dish.id, n)} name={dish.name} size="sm" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetQty(dish.id, 1)}
                      aria-label={`Ajouter ${dish.name} au panier`}
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
