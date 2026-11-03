'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { startCheckout } from '@/lib/billing-client'
import { ANNUAL_DISCOUNT, type Billing, type PlanId, amountDue, formatFCFA, getPlan, monthlyPrice, plans } from '@/lib/plans'

const focusRing = 'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40'

/**
 * Choix de la formule et du rythme, puis paiement par Mobile Money via FedaPay.
 * Le prix affiché ici est indicatif : c'est la base de données qui calcule le montant réellement facturé.
 */
export function CheckoutForm({ initialPlan, initialBilling, memberCount = 0 }: { initialPlan: PlanId; initialBilling: Billing; memberCount?: number }) {
  const [planId, setPlanId] = useState<PlanId>(initialPlan)
  const [billing, setBilling] = useState<Billing>(initialBilling)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const plan = getPlan(planId)
  const limit = plan.id === 'basique' ? 5 : plan.id === 'standard' ? 15 : null
  const tooMany = limit !== null && memberCount > limit

  async function pay() {
    if (tooMany) return setError(`Votre équipe compte ${memberCount} membres, la formule ${plan.name} en autorise ${limit}. Choisissez une formule plus large.`)
    setBusy(true)
    setError('')
    const result = await startCheckout(planId, billing)
    if (!result.ok) {
      setError(result.error)
      setBusy(false)
      return
    }
    window.location.assign(result.url) // la page de paiement FedaPay prend le relais ; le retour se fait sur /abonnement/retour
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Formule" className="grid gap-2">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={planId === p.id}
            onClick={() => setPlanId(p.id)}
            className={cn('flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors', planId === p.id ? 'border-ember bg-[#fff3e6] ring-2 ring-ember/30' : 'border-border bg-card hover:border-ember/50', focusRing)}
          >
            <span className="font-semibold">{p.name}</span>
            <span className="text-sm tabular-nums text-muted-foreground">{formatFCFA(monthlyPrice(p, billing))} FCFA / mois</span>
          </button>
        ))}
      </div>

      <div role="radiogroup" aria-label="Facturation" className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
        {(['mensuel', 'annuel'] as const).map((b) => (
          <button
            key={b}
            type="button"
            role="radio"
            aria-checked={billing === b}
            onClick={() => setBilling(b)}
            className={cn('h-11 rounded-lg text-sm font-semibold transition-colors', billing === b ? 'bg-ember text-primary-foreground shadow-md shadow-ember/25' : 'text-foreground/80 hover:bg-muted/60', focusRing)}
          >
            {b === 'mensuel' ? 'Mensuelle' : `Annuelle −${Math.round(ANNUAL_DISCOUNT * 100)} %`}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-sand/60 p-4 text-center">
        <p className="font-serif text-3xl font-semibold tabular-nums text-ember-deep">
          {formatFCFA(amountDue(plan, billing))} <span className="text-lg">FCFA</span>
        </p>
        <p className="text-sm text-muted-foreground">pour {billing === 'annuel' ? '1 an' : '1 mois'}</p>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void pay()}
        disabled={busy}
        className={cn('mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember to-ember-deep text-base font-semibold text-primary-foreground shadow-lg shadow-ember-deep/25 disabled:opacity-70', focusRing)}
      >
        {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {busy ? 'Ouverture du paiement…' : `Payer ${formatFCFA(amountDue(plan, billing))} FCFA`}
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Paiement sécurisé par FedaPay : MTN, Moov, Celtiis ou carte. Vous choisirez votre opérateur sur la page suivante.</p>
    </div>
  )
}
