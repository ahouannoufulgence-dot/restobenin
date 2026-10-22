import { CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { formatFCFA, plans } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { Ornament } from './trusted-by'

export function Pricing() {
  return (
    <section id="tarifs" className="scroll-mt-10 bg-cream pb-24 pt-6" aria-labelledby="pricing-title">
      <div id="solutions" className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="text-center">
          <h2 id="pricing-title" className="text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
            Des solutions pensées pour chaque restaurant
          </h2>
          <p className="mt-4 flex items-center justify-center gap-3 text-muted-foreground">
            <Ornament />
            Trois forfaits. Zéro compromis sur l&apos;excellence.
            <Ornament />
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-card p-8 transition-shadow',
                plan.featured
                  ? 'border-ember/60 shadow-2xl shadow-ember/15 md:-translate-y-3'
                  : 'border-border shadow-sm hover:shadow-lg',
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-md bg-gold px-4 py-1 text-xs font-semibold uppercase tracking-wider text-espresso">
                  Le plus choisi
                </span>
              )}
              <header className="text-center">
                <h3 className="font-serif text-2xl font-bold uppercase tracking-[0.15em] text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                <p className="mt-5 whitespace-nowrap border-b border-border pb-6 lining-nums">
                  <span className="font-serif text-5xl font-semibold text-foreground">{formatFCFA(plan.monthly)}</span>
                  <span className="ml-1.5 font-serif text-2xl text-foreground">FCFA</span>
                  <span className="ml-1 text-sm text-muted-foreground">/mois</span>
                </p>
              </header>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground/85">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={`/inscription?plan=${plan.id}`}
                className={cn(
                  'mt-8 rounded-md px-5 py-3 text-center text-sm font-semibold transition-colors',
                  plan.featured
                    ? 'bg-ember text-primary-foreground shadow-lg shadow-ember/25 hover:bg-ember-deep'
                    : 'border border-foreground/25 text-foreground hover:border-ember hover:text-ember',
                )}
              >
                Choisir {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
