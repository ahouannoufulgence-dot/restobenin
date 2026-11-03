'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Billing, PlanId } from '@/lib/plans'
import { CheckoutForm } from './checkout-form'

/**
 * Écran affiché quand l'essai gratuit ou la période payée est terminé(e). Les données du restaurant sont conservées ;
 * un paiement réactive l'accès tout de suite (la page détecte la réactivation toute seule).
 */
export function ExpiredScreen({
  restaurant,
  planId,
  billing,
  memberCount,
  onRecheck,
  onSignOut,
}: {
  restaurant: string
  planId: PlanId
  billing: Billing
  memberCount: number
  onRecheck: () => void
  onSignOut: () => void
}) {
  return (
    <main className="min-h-dvh bg-background px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <div role="alert" className="rounded-2xl border border-border bg-card p-6 shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]">
          <h1 className="font-serif text-3xl font-semibold">Votre période d’accès est terminée</h1>
          <p className="mt-2 text-muted-foreground">
            L’accès de {restaurant ? <strong>{restaurant}</strong> : 'votre restaurant'} est suspendu : vos clients ne peuvent plus commander et l’équipe est en lecture seule. Vos données sont conservées.
            Payez votre abonnement pour reprendre immédiatement.
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]">
          <h2 className="mb-3 font-serif text-xl font-semibold">Choisir et payer</h2>
          <CheckoutForm initialPlan={planId} initialBilling={billing} memberCount={memberCount} />
        </div>

        <div className="mt-4 grid gap-2">
          <button type="button" onClick={onRecheck} className={cn('h-11 rounded-xl border border-border bg-card text-sm font-semibold hover:border-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30')}>
            J’ai déjà payé : vérifier à nouveau
          </button>
          <Link href="/connexion" onClick={onSignOut} className="inline-flex h-11 items-center justify-center text-sm font-semibold text-muted-foreground hover:text-foreground">
            Se déconnecter
          </Link>
        </div>
      </div>
    </main>
  )
}
