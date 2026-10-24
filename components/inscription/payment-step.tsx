'use client'

import { ArrowLeft, CreditCard, Landmark, Loader2, Phone, ShieldCheck, Smartphone } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { type Billing, type Plan, amountDue, formatFCFA, monthlyPrice } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { GlassCard, StepHeading, TextField, ghostButton, primaryButton } from './ui'

export type PaymentMethodId = 'mtn' | 'moov' | 'celtiis' | 'card' | 'transfer'

const methods: { id: PaymentMethodId; label: string; hint: string; icon: LucideIcon; badge?: string; mobile?: boolean }[] = [
  { id: 'mtn', label: 'MTN Mobile Money', hint: 'Validation instantanée sur votre téléphone', icon: Smartphone, badge: 'MTN', mobile: true },
  { id: 'moov', label: 'Moov Money', hint: 'Validation instantanée sur votre téléphone', icon: Smartphone, badge: 'Moov', mobile: true },
  { id: 'celtiis', label: 'Celtiis Cash', hint: 'Validation instantanée sur votre téléphone', icon: Smartphone, badge: 'Celtiis', mobile: true },
  { id: 'card', label: 'Carte bancaire', hint: 'Visa, Mastercard', icon: CreditCard },
  { id: 'transfer', label: 'Virement bancaire', hint: 'Activation sous 24 à 48 h ouvrées', icon: Landmark },
]

export function PaymentStep({
  restaurant,
  phone,
  plan,
  billing,
  method,
  onMethodChange,
  onBack,
  onPaid,
}: {
  restaurant: string
  phone: string
  plan: Plan
  billing: Billing
  method: PaymentMethodId | null
  onMethodChange: (method: PaymentMethodId) => void
  onBack: () => void
  onPaid: () => void
}) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selected = methods.find((m) => m.id === method)
  const total = amountDue(plan, billing)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) {
      setError('Sélectionnez une méthode de paiement.')
      return
    }
    if (selected.mobile) {
      const digits = String(new FormData(event.currentTarget).get('momo') ?? '').replace(/\D/g, '')
      if (digits.length !== 8 && digits.length !== 10) {
        setError('Saisissez un numéro Mobile Money valide.')
        document.getElementById('momo')?.focus()
        return
      }
    }
    setError(null)
    setProcessing(true)
    window.setTimeout(onPaid, 1600)
  }

  const rows = [
    { label: 'Restaurant', value: restaurant },
    { label: 'Plan choisi', value: `${plan.name} · ${billing === 'annuel' ? 'Annuel' : 'Mensuel'}` },
    {
      label: 'Montant',
      value: billing === 'annuel' ? `${formatFCFA(monthlyPrice(plan, billing))} FCFA × 12 mois` : `${formatFCFA(plan.monthly)} FCFA /mois`,
    },
  ]

  return (
    <section aria-labelledby="payment-title" className="mx-auto w-full max-w-5xl">
      <StepHeading id="payment-title" title="Récapitulatif et paiement" subtitle="Vérifiez votre commande, puis choisissez votre moyen de paiement." />

      <form noValidate onSubmit={handleSubmit} className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-5 sm:mt-10 sm:gap-6 lg:grid-cols-5">
        <GlassCard className="p-5 sm:p-8 lg:col-span-2">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Résumé</h2>
          <dl className="mt-5 divide-y divide-border">
            {rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 py-3 text-sm sm:py-3.5">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-right font-medium text-foreground lining-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-2 flex items-baseline justify-between gap-4 rounded-xl bg-sand/60 px-4 py-4">
            <span className="font-serif text-lg font-semibold text-foreground sm:text-xl">Total à payer</span>
            <span className="whitespace-nowrap font-serif text-2xl font-semibold text-ember lining-nums sm:text-3xl">
              {formatFCFA(total)} <span className="text-lg">FCFA</span>
            </span>
          </div>
          {billing === 'annuel' && (
            <p className="mt-3 text-xs text-muted-foreground">
              Vous économisez {formatFCFA(plan.monthly * 12 - total)} FCFA par rapport au paiement mensuel.
            </p>
          )}
        </GlassCard>

        <GlassCard className="p-5 sm:p-8 lg:col-span-3">
          <fieldset className="min-w-0">
            <legend className="font-serif text-2xl font-semibold text-foreground">Méthode de paiement</legend>
            <div className="mt-5 flex flex-col gap-3">
              {methods.map((m) => (
                <div key={m.id}>
                  <label
                    className={cn(
                      'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-background/60 px-3.5 py-3 transition-colors hover:border-ember/50 sm:gap-4 sm:px-4 sm:py-3.5',
                      'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ember/25',
                      method === m.id ? 'border-ember bg-ember/5' : 'border-border',
                    )}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={m.id}
                      checked={method === m.id}
                      onChange={() => {
                        onMethodChange(m.id)
                        setError(null)
                      }}
                      className="size-5 shrink-0 accent-ember sm:size-4"
                    />
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sand text-terracotta">
                      {m.badge ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide">{m.badge}</span>
                      ) : (
                        <m.icon className="size-5" aria-hidden="true" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold text-foreground">{m.label}</span>
                      <span className="text-xs text-muted-foreground">{m.hint}</span>
                    </span>
                  </label>
                  {method === m.id && m.mobile && (
                    <TextField
                      id="momo"
                      label={`Numéro ${m.label}`}
                      icon={Phone}
                      prefix="+229"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      defaultValue={phone}
                      wrapperClassName="mt-3 px-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </fieldset>

          <p className="mt-3 min-h-5 text-sm font-medium text-destructive" role="alert">
            {error}
          </p>

          <div className="max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:-mx-5 max-lg:mt-2 max-lg:border-t max-lg:border-border max-lg:bg-card/95 max-lg:px-5 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-lg:pt-3 max-lg:backdrop-blur lg:mt-2">
          <button type="submit" disabled={processing} className={cn(primaryButton, 'w-full')}>
            {processing ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Traitement en cours…
              </>
            ) : (
              <>Payer maintenant · {formatFCFA(total)} FCFA</>
            )}
          </button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            Paiement 100% sécurisé et crypté
          </p>
        </GlassCard>
      </form>

      <div className="mt-8 flex justify-center">
        <button type="button" onClick={onBack} disabled={processing} className={ghostButton}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Modifier la formule
        </button>
      </div>
    </section>
  )
}
