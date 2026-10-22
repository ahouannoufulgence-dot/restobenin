import { ArrowLeft, ChevronRight, ShoppingBag, Trash2, Wallet } from 'lucide-react'
import { SERVICE_FEE, getDish } from '@/lib/client-data'
import { fcfa } from '@/lib/gerant-data'
import { DishImage, QtyStepper, emberAction, outlineAction, roundButton } from './ui'

export function CartScreen({
  cart,
  onSetQty,
  onBack,
  onOrder,
}: {
  cart: Record<string, number>
  onSetQty: (id: string, qty: number) => void
  onBack: () => void
  onOrder: () => void
}) {
  const lines = Object.entries(cart).flatMap(([id, qty]) => {
    const dish = getDish(id)
    return dish ? [{ dish, qty }] : []
  })
  const subtotal = lines.reduce((sum, l) => sum + l.dish.price * l.qty, 0)

  return (
    <div className="px-4 pb-8 pt-5">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onBack} className={roundButton} aria-label="Retour au menu">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <h1 className="font-serif text-2xl font-semibold">Panier</h1>
      </header>

      {lines.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-sand text-ember-deep">
            <ShoppingBag className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-4 font-serif text-xl font-semibold">Votre panier est vide</p>
          <p className="mt-1 text-sm text-muted-foreground">Choisissez vos plats dans le menu pour commencer.</p>
          <button type="button" onClick={onBack} className={`${emberAction} mt-6 max-w-64`}>
            Voir le menu
          </button>
        </div>
      ) : (
        <>
          <ul className="mt-5 flex flex-col gap-3">
            {lines.map(({ dish, qty }) => (
              <li key={dish.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <DishImage dish={dish} sizes="64px" className="size-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{dish.name}</p>
                  <p className="text-sm font-semibold tabular-nums text-ember-deep">{fcfa(dish.price * qty)}</p>
                  <div className="mt-1.5">
                    <QtyStepper qty={qty} onChange={(n) => onSetQty(dish.id, n)} name={dish.name} min={1} size="sm" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSetQty(dish.id, 0)}
                  aria-label={`Retirer ${dish.name} du panier`}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/30"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sous-total</dt>
              <dd className="font-medium tabular-nums">{fcfa(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frais de service</dt>
              <dd className="font-medium tabular-nums">{fcfa(SERVICE_FEE)}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-border pt-3">
              <dt className="font-serif text-xl font-semibold">Total</dt>
              <dd className="font-serif text-2xl font-semibold tabular-nums text-ember-deep">{fcfa(subtotal + SERVICE_FEE)}</dd>
            </div>
          </dl>

          <button type="button" onClick={onOrder} className={`${emberAction} mt-6`}>
            Commander
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Wallet className="size-4" aria-hidden="true" />
            Paiement à table, auprès du serveur
          </p>
        </>
      )}
    </div>
  )
}
