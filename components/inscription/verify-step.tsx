'use client'

import { ArrowRight, Check, Mail, PencilLine, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { EmailCodeBox } from '@/components/connexion/email-code-box'
import { GlassCard, ghostButton, secondaryButton } from './ui'

export function VerifyStep({
  email,
  onEditEmail,
  onVerified,
  onVerifyCode,
  onCheck,
  onResend,
}: {
  email: string
  onEditEmail: () => void
  onVerified: () => void
  /** Vérifie le code reçu par e-mail. Renvoie un message d'erreur, ou null si le code est bon. */
  onVerifyCode: (code: string) => Promise<string | null>
  /** Vérifie que l'e-mail est confirmé. Renvoie un message d'erreur, ou null si tout est bon. */
  onCheck: () => Promise<string | null>
  onResend: () => Promise<string | null>
}) {
  const [resentCount, setResentCount] = useState(0)
  const [busy, setBusy] = useState<'check' | 'resend' | null>(null)
  const [error, setError] = useState('')

  async function check() {
    setBusy('check')
    setError('')
    const failure = await onCheck()
    setBusy(null)
    if (failure) setError(failure)
    else onVerified()
  }

  async function resend() {
    setBusy('resend')
    setError('')
    const failure = await onResend()
    setBusy(null)
    if (failure) setError(failure)
    else setResentCount((c) => c + 1)
  }

  return (
    <section aria-labelledby="verify-title" className="mx-auto w-full max-w-xl">
      <GlassCard className="flex flex-col items-center px-5 py-9 text-center sm:px-12 sm:py-12">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-success/20 blur-xl" aria-hidden="true" />
          <span className="relative flex size-20 items-center justify-center sm:size-24 rounded-full bg-success shadow-xl shadow-success/30">
            <Check className="size-12 text-white" strokeWidth={3} aria-hidden="true" />
          </span>
          <span className="absolute -bottom-1 -right-2 flex size-10 items-center justify-center rounded-full border-4 border-card bg-ember">
            <Mail className="size-4 text-primary-foreground" aria-hidden="true" />
          </span>
        </div>

        <h1 id="verify-title" className="mt-6 text-balance font-serif text-3xl font-semibold text-foreground sm:mt-8 sm:text-4xl">
          Vérifiez votre adresse e-mail
        </h1>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          Un e-mail contenant un <strong className="text-foreground">code</strong> a été envoyé à{' '}
          <span className="break-all font-semibold text-foreground">{email}</span>. Saisissez ce code ci-dessous pour activer
          votre compte.
        </p>

        <EmailCodeBox
          className="mt-6"
          onSubmit={async (code) => {
            const failure = await onVerifyCode(code)
            if (!failure) onVerified()
            return failure
          }}
        />

        <p className="mt-6 text-sm text-muted-foreground">Vous préférez le lien ? Cliquez dessus dans l’e-mail, puis revenez ici.</p>

        <p className={`mt-3 min-h-5 text-sm font-medium ${error ? 'text-destructive' : 'text-success'}`} role={error ? 'alert' : 'status'}>
          {error || (resentCount > 0 && 'Un nouvel e-mail de vérification vient d’être envoyé.')}
        </p>

        <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto">
          <button type="button" onClick={resend} disabled={busy !== null} className={secondaryButton}>
            <RotateCw className="size-4" aria-hidden="true" />
            Renvoyer l&apos;e-mail
          </button>
          <button type="button" onClick={check} disabled={busy !== null} className={secondaryButton}>
            {busy === 'check' ? 'Vérification…' : 'J’ai cliqué sur le lien'}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        <button type="button" onClick={onEditEmail} className={`${ghostButton} mt-6`}>
          <PencilLine className="size-4" aria-hidden="true" />
          Modifier l&apos;adresse e-mail
        </button>
      </GlassCard>
    </section>
  )
}
