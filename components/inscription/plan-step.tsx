'use client'

import { ArrowLeft, CircleCheck } from 'lucide-react'
import { Ornament } from '@/components/restoben/trusted-by'
import { type Billing, type PlanId, amountDue, formatFCFA, monthlyPrice, plans } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { ghostButton } from './ui'

export function PlanStep({
  selectedPlan,
  billing,
  onBillingChange,
  onSelect,
  onBack,
}: {
  selectedPlan: PlanId
  billing: Billing
  onBillingChange: (billing: Billing) => void
  onSelect: (plan: PlanId) => void
  onBack: () => void
}) {
  return (
    <section aria-labelledby="plan-title" className="mx-auto w-full max-w-6xl">
      <div className="text-center">
        <h1 id="plan-title" className="text-balance font-serif text-3xl font-semibold text-foreground sm:text-5xl">
          Choisissez la formule qui vous ressemble
        </h1>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:gap-3 sm:text-base">
          <Ornament />
          Trois forfaits. Zéro compromis sur l&apos;excellence.
          <Ornament />
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
        <div role="radiogroup" aria-label="Période de facturation" className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
          {(['mensuel', 'annuel'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={billing === option}
              onClick={() => onBillingChange(option)}
              className={cn(
                'rounded-full px-6 py-2 text-sm font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30',
                billing === option ? 'bg-ember text-primary-foreground shadow-md shadow-ember/25' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-terracotta">Économisez 20%</span>
      </div>

      <div className="mt-10 grid items-stretch gap-6 sm:mt-14 md:grid-cols-3">
        {plans.map((plan) => {
          const selected = plan.id === selectedPlan
          return (
            <article
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-card/85 p-5 backdrop-blur transition-shadow sm:p-8',
                plan.featured && 'max-md:order-first',
                plan.featured ? 'border-ember/60 shadow-2xl shadow-ember/15 md:-translate-y-3' : 'border-border shadow-sm hover:shadow-lg',
                selected && 'ring-2 ring-ember/40',
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ember px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                  Le plus choisi
                </span>
              )}
              <header className="text-center">
                <h2 className="font-serif text-2xl font-bold uppercase tracking-[0.15em] text-foreground">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                <div className="mt-4 border-b border-border pb-5 lining-nums sm:mt-5 sm:pb-6">
                  <p className="whitespace-nowrap">
                    <span className="font-serif text-4xl font-semibold text-foreground sm:text-5xl">
                      {formatFCFA(monthlyPrice(plan, billing))}
                    </span>
                    <span className="ml-1.5 font-serif text-2xl text-foreground">FCFA</span>
                    <span className="ml-1 text-sm text-muted-foreground">/mois</span>
                  </p>
                  <p className="mt-2 min-h-5 text-xs text-muted-foreground">
                    {billing === 'annuel' ? (
                      <>
                        <s className="mr-1.5">{formatFCFA(plan.monthly)} FCFA</s>
                        soit {formatFCFA(amountDue(plan, billing))} FCFA facturés par an
                      </>
                    ) : (
                      'Sans engagement, résiliable à tout moment'
                    )}
                  </p>
                </div>
              </header>

              <ul className="mt-5 flex flex-1 flex-col gap-2.5 sm:mt-6 sm:gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground/85">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onSelect(plan.id)}
                aria-label={`Choisir la formule ${plan.name}`}
                className={cn(
                  'mt-6 min-h-12 rounded-lg px-5 py-3 text-center text-sm font-semibold sm:mt-8 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30',
                  plan.featured || selected
                    ? 'bg-ember text-primary-foreground shadow-lg shadow-ember/25 hover:bg-ember-deep'
                    : 'border border-foreground/25 text-foreground hover:border-ember hover:text-ember',
                )}
              >
                Choisir
              </button>
            </article>
          )
        })}
      </div>

      <div className="mt-8 flex justify-center sm:mt-10">
        <button type="button" onClick={onBack} className={ghostButton}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Retour
        </button>
      </div>
    </section>
  )
}
