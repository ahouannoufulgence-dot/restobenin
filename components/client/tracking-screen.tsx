import { ArrowLeft, Check, ReceiptText, Star, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stages, type PlacedOrder } from '@/lib/client-data'
import { fcfa } from '@/lib/gerant-data'
import { emberAction, outlineAction, roundButton } from './ui'

const time = (t: number) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function TrackingScreen({
  order,
  onMenu,
  onReview,
  onBack,
}: {
  order: PlacedOrder | null
  onMenu: () => void
  onReview: () => void
  onBack: () => void
}) {
  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-5 lg:pt-10">
        <h1 className="font-serif text-2xl font-semibold lg:text-4xl">Suivi de commande</h1>
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-sand text-ember-deep">
            <ReceiptText className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-4 font-serif text-xl font-semibold">Aucune commande pour l’instant</p>
          <p className="mt-1 text-sm text-muted-foreground">Une fois votre commande passée, vous pourrez suivre son avancement ici.</p>
          <button type="button" onClick={onMenu} className={`${emberAction} mt-6 max-w-64`}>
            Voir le menu
          </button>
        </div>
      </div>
    )
  }

  const served = order.stage >= 3
  const cancelled = !!order.cancelled

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-5 lg:pt-10">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onBack} className={roundButton} aria-label="Retour">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-semibold leading-tight lg:text-4xl">Suivi de commande</h1>
          <p className="text-sm text-muted-foreground">
            Commande <span className="font-semibold text-ember-deep">#{order.number}</span> · {fcfa(order.total)}
          </p>
        </div>
      </header>

      {cancelled && (
        <p role="alert" className="mt-6 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
          Cette commande a été annulée par le restaurant. Appelez un serveur si besoin.
        </p>
      )}
      <div className="lg:mt-10 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-12">
      <ol className="mt-8 flex flex-col lg:mt-0" aria-label="Étapes de la commande">
        {stages.map((s, i) => {
          const done = i <= order.stage
          const current = i === order.stage && !served
          return (
            <li key={s.title} className="relative flex gap-4 pb-8 last:pb-0" aria-current={current ? 'step' : undefined}>
              {i < stages.length - 1 && (
                <span className={cn('absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5', i < order.stage ? 'bg-success' : 'bg-border')} aria-hidden="true" />
              )}
              <span
                className={cn(
                  'relative flex size-7 shrink-0 items-center justify-center rounded-full border-2',
                  done ? 'border-success bg-success text-primary-foreground' : 'border-border bg-background',
                )}
              >
                {done && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                {current && <span className="absolute inset-0 animate-ping rounded-full bg-success/40 motion-reduce:hidden" aria-hidden="true" />}
              </span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className={cn('font-semibold', !done && 'text-muted-foreground')}>{s.title}</p>
                  <p className="text-sm tabular-nums text-muted-foreground">{done ? time(order.times[i]) : '–'}</p>
                </div>
                <p className="text-sm text-muted-foreground">{s.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div>
      <section className="mt-8 rounded-2xl border border-border bg-card p-4" aria-label="Récapitulatif">
        <ul className="flex flex-col gap-1.5 text-sm">
          {order.lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-3">
              <span>
                {l.qty} × {l.name}
              </span>
              <span className="tabular-nums text-muted-foreground">{fcfa(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 rounded-2xl bg-sand/70 p-5 text-center">
        <UtensilsCrossed className="mx-auto size-8 text-ember-deep" strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-2 font-serif text-xl font-semibold">Merci pour votre commande !</p>
        <p className="text-sm text-muted-foreground">Nous vous remercions pour votre confiance.</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {served && (
          <button type="button" onClick={onReview} className={outlineAction}>
            <Star className="size-4 text-gold" aria-hidden="true" />
            Laisser un avis
          </button>
        )}
        <button type="button" onClick={onMenu} className={served ? emberAction : outlineAction}>
          Commander autre chose
        </button>
      </div>
      </div>
      </div>
    </div>
  )
}
