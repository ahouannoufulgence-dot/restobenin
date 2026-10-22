import { Check } from 'lucide-react'
import { Logo } from '@/components/restoben/logo'
import { cn } from '@/lib/utils'

export const signupSteps = ['Compte', 'Vérification', 'Abonnement', 'Paiement', 'Confirmation'] as const

export function SignupHeader({ step }: { step: number }) {
  const total = signupSteps.length
  const finished = step === total

  return (
    <header className="relative overflow-hidden bg-espresso text-cream">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,93,4,0.28),transparent_55%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 pt-6 lg:px-10">
        <Logo href="/" />
        <p className="whitespace-nowrap rounded-full border border-cream/15 bg-cream/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-cream/70 backdrop-blur">
          Étape <span className="text-cream">{step}</span>/{total}
        </p>
      </div>

      <nav aria-label="Progression de l’inscription" className="relative mx-auto max-w-6xl px-6 pb-7 pt-8 lg:px-10">
        <ol className="flex items-center">
          {signupSteps.map((label, index) => {
            const n = index + 1
            const done = n < step || finished
            const current = n === step && !finished
            return (
              <li
                key={label}
                className={cn('flex items-center', n < total && 'flex-1')}
                aria-current={n === step ? 'step' : undefined}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors lining-nums',
                      done && 'border-ember bg-ember text-primary-foreground',
                      current && 'border-ember bg-ember/15 text-cream ring-4 ring-ember/20',
                      !done && !current && 'border-cream/20 text-cream/50',
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={2.5} aria-hidden="true" /> : n}
                  </span>
                  <span
                    className={cn(
                      'hidden whitespace-nowrap text-sm md:inline',
                      done || current ? 'text-cream' : 'text-cream/50',
                    )}
                  >
                    {label}
                  </span>
                  <span className="sr-only md:hidden">{label}</span>
                  <span className="sr-only">{done ? ' (terminée)' : current ? ' (en cours)' : ''}</span>
                </span>
                {n < total && (
                  <span
                    className={cn('mx-3 h-px flex-1 transition-colors', n < step ? 'bg-ember' : 'bg-cream/15')}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </header>
  )
}
