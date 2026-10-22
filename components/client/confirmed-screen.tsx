import { Check, Star, Truck } from 'lucide-react'
import type { PlacedOrder } from '@/lib/client-data'
import { emberAction, outlineAction } from './ui'

const confetti = [
  { left: '8%', top: '6%', color: 'bg-ember', rotate: '30deg', delay: '0s' },
  { left: '22%', top: '14%', color: 'bg-gold', rotate: '70deg', delay: '0.1s' },
  { left: '38%', top: '4%', color: 'bg-success', rotate: '15deg', delay: '0.2s' },
  { left: '62%', top: '8%', color: 'bg-ember', rotate: '55deg', delay: '0.05s' },
  { left: '78%', top: '16%', color: 'bg-gold', rotate: '20deg', delay: '0.15s' },
  { left: '90%', top: '5%', color: 'bg-success', rotate: '80deg', delay: '0.25s' },
  { left: '14%', top: '30%', color: 'bg-gold', rotate: '45deg', delay: '0.3s' },
  { left: '86%', top: '32%', color: 'bg-ember', rotate: '65deg', delay: '0.12s' },
]

export function ConfirmedScreen({
  order,
  onTrack,
  onReview,
  onMenu,
}: {
  order: PlacedOrder
  onTrack: () => void
  onReview: () => void
  onMenu: () => void
}) {
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center px-6 pb-10 pt-24 text-center lg:justify-center lg:pt-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56" aria-hidden="true">
        {confetti.map((c, i) => (
          <span
            key={i}
            className={`confetti-piece absolute h-3.5 w-1.5 rounded-sm ${c.color}`}
            style={{ left: c.left, top: c.top, ['--rotate' as string]: c.rotate, ['--delay' as string]: c.delay }}
          />
        ))}
      </div>

      <span className="flex size-24 items-center justify-center rounded-full bg-success text-primary-foreground shadow-xl shadow-success/30">
        <Check className="size-12" strokeWidth={3} aria-hidden="true" />
      </span>
      <h1 className="mt-8 font-serif text-4xl font-semibold leading-tight text-balance">Commande confirmée !</h1>
      <p className="mt-3 text-pretty text-muted-foreground">
        Votre commande <span className="font-semibold text-ember-deep">#{order.number}</span> a bien été enregistrée.
      </p>

      <div className="mt-10 flex w-full flex-col gap-3">
        <button type="button" onClick={onTrack} className={emberAction}>
          <Truck className="size-4" aria-hidden="true" />
          Voir le suivi
        </button>
        <button type="button" onClick={onReview} className={outlineAction}>
          <Star className="size-4 text-gold" aria-hidden="true" />
          Laisser un avis
        </button>
      </div>
      <button
        type="button"
        onClick={onMenu}
        className="mt-6 rounded-lg px-3 py-2 text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
      >
        Retour au menu
      </button>
    </main>
  )
}
