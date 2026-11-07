'use client'

import { ArrowLeft, CalendarCheck, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { type Billing, type Plan, amountDue, formatFCFA } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { GlassCard, StepHeading, ghostButton, primaryButton } from './ui'

export const TRIAL_DAYS = 20

/**
 * Dernière étape de l'inscription avec la base de données : l'essai gratuit démarre sans aucun paiement.
 * (Le paiement se fait plus tard, depuis l'écran Abonnement, par Mobile Money via FedaPay.)
 */
export function TrialStep({
  restaurant,
  plan,
  billing,
  onBack,
  onStart,
}: {
  restaurant: string
  plan: Plan
  billing: Billing
  onBack: () => void
  /** Crée le restaurant. Renvoie un message d'erreur, ou null si tout est bon. */
  onStart: () => Promise<string | null>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const afterTrial = amountDue(plan, billing)

  async function start() {
    setBusy(true)
    setError(null)
    const failure = await onStart()
    if (failure) {
      setBusy(false)
      setError(failure)
    }
  }

  const rows = [
    { label: 'Restaurant', value: restaurant },
    { label: 'Formule choisie', value: `${plan.name} · ${billing === 'annuel' ? 'Annuelle' : 'Mensuelle'}` },
    { label: 'Durée de l’essai', value: `${TRIAL_DAYS} jours` },
  ]

  return (
    <section aria-labelledby="trial-title" className="mx-auto w-full max-w-2xl">
      <StepHeading id="trial-title" title={`Votre essai gratuit de ${TRIAL_DAYS} jours`} subtitle="Aucun paiement aujourd’hui. Vous testez RestoBen avec toutes les fonctions de votre formule." />

      <GlassCard className="mt-6 p-5 sm:mt-10 sm:p-8">
        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-3 text-sm sm:py-3.5">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-medium text-foreground lining-nums">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-2 flex items-baseline justify-between gap-4 rounded-xl bg-sand/60 px-4 py-4">
          <span className="font-serif text-lg font-semibold text-foreground sm:text-xl">À payer aujourd’hui</span>
          <span className="whitespace-nowrap font-serif text-2xl font-semibold text-ember lining-nums sm:text-3xl">
            0 <span className="text-lg">FCFA</span>
          </span>
        </div>

        <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
          <CalendarCheck className="mt-0.5 size-4 shrink-0 text-ember" aria-hidden="true" />
          <span>
            Après l’essai : {formatFCFA(afterTrial)} FCFA pour {billing === 'annuel' ? '1 an' : '1 mois'}, à régler par Mobile Money (MTN, Moov, Celtiis) depuis l’écran Abonnement.
            Sans paiement, l’accès est suspendu à la fin de l’essai ; vos données sont conservées.
          </span>
        </p>

        <p className="mt-3 min-h-5 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>

        <button type="button" onClick={() => void start()} disabled={busy} className={cn(primaryButton, 'mt-2 w-full')}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Création de votre restaurant…
            </>
          ) : (
            <>Démarrer mon essai gratuit</>
          )}
        </button>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-success" aria-hidden="true" />
          Sans engagement et sans carte bancaire
        </p>
      </GlassCard>

      <div className="mt-8 flex justify-center">
        <button type="button" onClick={onBack} disabled={busy} className={ghostButton}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Modifier la formule
        </button>
      </div>
    </section>
  )
}
