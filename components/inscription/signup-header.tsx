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
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-5 sm:gap-6 sm:px-6 sm:pt-6 lg:px-10">
        <Logo href="/" hideTaglineOnMobile className="shrink-0 [&_svg]:max-sm:size-8" />
        <p className="min-w-0 truncate whitespace-nowrap rounded-full border border-cream/15 bg-cream/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-cream/70 backdrop-blur sm:px-4 sm:text-xs sm:tracking-[0.16em]">
          Étape <span className="text-cream">{step}</span>/{total}
        </p>
      </div>

      <nav aria-label="Progression de l’inscription" className="relative mx-auto max-w-6xl px-4 pb-5 pt-6 sm:px-6 sm:pb-7 sm:pt-8 lg:px-10">
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
                      'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors lining-nums sm:size-9',
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
                    className={cn('mx-2 h-px flex-1 transition-colors sm:mx-3', n < step ? 'bg-ember' : 'bg-cream/15')}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>
        <p className="mt-3 text-center text-sm font-medium text-cream md:hidden" aria-hidden="true">
          {signupSteps[Math.min(step, total) - 1]}
        </p>
      </nav>
    </header>
  )
}
