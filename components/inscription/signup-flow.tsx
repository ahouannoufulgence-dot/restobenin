'use client'

import { Phone } from 'lucide-react'
import { useRef, useState } from 'react'
import { type Billing, type PlanId, getPlan } from '@/lib/plans'
import { type AccountData, AccountStep } from './account-step'
import { type PaymentMethodId, PaymentStep } from './payment-step'
import { PlanStep } from './plan-step'
import { SignupHeader } from './signup-header'
import { SuccessStep } from './success-step'
import { VerifyStep } from './verify-step'

export function SignupFlow({ initialPlan }: { initialPlan?: PlanId }) {
  const [step, setStep] = useState(1)
  const [account, setAccount] = useState<AccountData | null>(null)
  const [planId, setPlanId] = useState<PlanId>(initialPlan ?? 'standard')
  const [billing, setBilling] = useState<Billing>('mensuel')
  const [method, setMethod] = useState<PaymentMethodId | null>(null)
  const mainRef = useRef<HTMLElement>(null)

  function goTo(next: number) {
    setStep(next)
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      mainRef.current?.focus({ preventScroll: true })
    })
  }

  const plan = getPlan(planId)

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <SignupHeader step={step} />

      <main
        ref={mainRef}
        tabIndex={-1}
        className="relative flex-1 bg-[radial-gradient(ellipse_at_top,var(--sand),transparent_65%)] px-4 py-8 outline-none sm:px-6 sm:py-20 lg:px-10"
      >
        <div key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {step === 1 && (
            <AccountStep
              defaultValues={account}
              onSubmit={(data) => {
                setAccount(data)
                goTo(2)
              }}
            />
          )}
          {step === 2 && account && (
            <VerifyStep email={account.email} onEditEmail={() => goTo(1)} onVerified={() => goTo(3)} />
          )}
          {step === 3 && (
            <PlanStep
              selectedPlan={planId}
              billing={billing}
              onBillingChange={setBilling}
              onBack={() => goTo(2)}
              onSelect={(id) => {
                setPlanId(id)
                goTo(4)
              }}
            />
          )}
          {step === 4 && account && (
            <PaymentStep
              restaurant={account.restaurant}
              phone={account.phone}
              plan={plan}
              billing={billing}
              method={method}
              onMethodChange={setMethod}
              onBack={() => goTo(3)}
              onPaid={() => goTo(5)}
            />
          )}
          {step === 5 && account && <SuccessStep restaurant={account.restaurant} planName={plan.name} email={account.email} />}
        </div>
      </main>

      <footer className="border-t border-border bg-cream px-4 py-5 text-center text-xs text-muted-foreground sm:px-6 sm:py-6">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <Phone className="size-3.5 text-ember" aria-hidden="true" />
          Besoin d&apos;aide ?
          <a href="tel:+2290197123456" className="font-medium text-foreground hover:text-ember">
            +229 01 97 12 34 56
          </a>
          <span aria-hidden="true">·</span>
          <span>© 2025 RestoBen · restoben.bj</span>
        </p>
      </footer>
    </div>
  )
}
