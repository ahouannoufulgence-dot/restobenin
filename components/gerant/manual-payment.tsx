'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Check, Clock, Copy, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatFCFA } from '@/lib/plans'
import { type ManualIntent, type PaymentState, getPaymentState, submitManualPayment } from '@/lib/manual-payment'

const focusRing = 'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40'
const input = 'mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-ember focus:ring-3 focus:ring-ember/20'
const primary = cn('inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember to-ember-deep text-base font-semibold text-primary-foreground shadow-lg shadow-ember-deep/25 disabled:opacity-70', focusRing)
const POLL_MS = 8000

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      aria-label={`Copier ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setDone(true)
          window.setTimeout(() => setDone(false), 1800)
        } catch {
          /* copie impossible : le texte reste visible */
        }
      }}
      className={cn('inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold hover:border-ember', focusRing)}
    >
      {done ? <Check className="size-4 text-success" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      {done ? 'Copié' : 'Copier'}
    </button>
  )
}

/**
 * Paiement manuel par Mobile Money : 1) le gérant envoie le montant au numéro de RestoBen, 2) il saisit le numéro de
 * transaction reçu par SMS, 3) RestoBen vérifie et valide. Cet écran suit ensuite la validation tout seul.
 */
export function ManualPayment({ intent, onBack, onPaid }: { intent: ManualIntent; onBack: () => void; onPaid: () => void }) {
  const { instructions: info } = intent
  const [ref, setRef] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [state, setState] = useState<PaymentState | null>(null)

  // Une fois la déclaration envoyée, on suit la décision de RestoBen (toutes les 8 secondes).
  useEffect(() => {
    if (!submitted) return
    let off = false
    let timer: number | undefined
    const poll = async () => {
      const next = await getPaymentState(intent.paymentId)
      if (off) return
      if (next) setState(next)
      if (next?.status === 'payee' || next?.status === 'echec') return
      timer = window.setTimeout(poll, POLL_MS)
    }
    void poll()
    return () => {
      off = true
      window.clearTimeout(timer)
    }
  }, [submitted, intent.paymentId])

  async function send() {
    setBusy(true)
    setError('')
    const failure = await submitManualPayment(intent.paymentId, ref, phone)
    setBusy(false)
    if (failure) setError(failure)
    else setSubmitted(true)
  }

  if (state?.status === 'payee') {
    return (
      <div role="status" className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" />
        <h3 className="mt-3 font-serif text-2xl font-semibold">Paiement validé</h3>
        <p className="mt-2 text-muted-foreground">Merci ! Votre abonnement est prolongé. Votre facture est disponible dans l’écran Abonnement.</p>
        <button type="button" onClick={onPaid} className={cn(primary, 'mt-5')}>Continuer</button>
      </div>
    )
  }

  if (state?.status === 'echec') {
    return (
      <div role="alert" className="text-center">
        <XCircle className="mx-auto size-12 text-destructive" aria-hidden="true" />
        <h3 className="mt-3 font-serif text-2xl font-semibold">Paiement non retrouvé</h3>
        <p className="mt-2 text-muted-foreground">{state.note || 'Nous n’avons pas retrouvé ce paiement.'}</p>
        <p className="mt-2 text-sm text-muted-foreground">Si vous avez bien payé, recommencez en vérifiant le numéro de transaction, ou contactez le support RestoBen.</p>
        <button type="button" onClick={onBack} className={cn(primary, 'mt-5')}>Recommencer</button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div role="status" aria-live="polite" className="text-center">
        <Clock className="mx-auto size-12 text-gold" aria-hidden="true" />
        <h3 className="mt-3 font-serif text-2xl font-semibold">Demande envoyée</h3>
        <p className="mt-2 text-muted-foreground">
          Nous vérifions votre paiement de <strong className="text-foreground">{formatFCFA(intent.amount)} FCFA</strong>. Votre abonnement sera prolongé dès qu’il est validé, en général dans la journée.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Vous pouvez fermer cette page : l’application se mettra à jour toute seule.</p>
      </div>
    )
  }

  return (
    <div>
      <ol className="grid gap-3 text-sm">
        <li className="rounded-xl border border-border bg-card p-4">
          <p className="font-semibold">1. Envoyez le montant par Mobile Money</p>
          <div className="mt-3 grid gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Montant exact</p>
                <p className="font-serif text-2xl font-semibold tabular-nums text-ember-deep">{formatFCFA(intent.amount)} FCFA</p>
              </div>
              <CopyButton value={String(intent.amount)} label="le montant" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{info.operator ? `Numéro ${info.operator}` : 'Numéro Mobile Money'}</p>
                <p className="font-mono text-lg font-semibold">{info.phone}</p>
                {info.holder && <p className="text-xs text-muted-foreground">Au nom de {info.holder}</p>}
              </div>
              <CopyButton value={info.phone} label="le numéro" />
            </div>
            <p className="text-xs text-muted-foreground">
              Si votre application le permet, indiquez le code <span className="font-mono font-semibold text-foreground">{intent.code}</span> en motif.{info.note ? ` ${info.note}` : ''}
            </p>
          </div>
        </li>

        <li className="rounded-xl border border-border bg-card p-4">
          <p className="font-semibold">2. Indiquez les références du paiement</p>
          <label htmlFor="mp-ref" className="mt-3 block text-sm font-medium">Numéro de transaction <span className="font-normal text-muted-foreground">(dans le SMS de confirmation)</span></label>
          <input id="mp-ref" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase().replace(/[^A-Z0-9._-]/g, '').slice(0, 40))} autoCapitalize="characters" autoComplete="off" placeholder="ex. MP2611AB12" className={cn(input, 'font-mono')} />
          <label htmlFor="mp-phone" className="mt-3 block text-sm font-medium">Numéro depuis lequel vous avez payé</label>
          <input id="mp-phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, '').slice(0, 20))} inputMode="tel" autoComplete="tel" placeholder="+229 01 00 00 00 00" className={input} />
        </li>
      </ol>

      {error && <p role="alert" className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}

      <button type="button" onClick={() => void send()} disabled={busy || ref.length < 4 || phone.replace(/\D/g, '').length < 8} className={cn(primary, 'mt-4')}>
        {busy ? 'Envoi…' : 'J’ai payé : envoyer'}
      </button>
      <button type="button" onClick={onBack} disabled={busy} className={cn('mt-2 inline-flex h-11 w-full items-center justify-center text-sm font-semibold text-muted-foreground hover:text-foreground', focusRing)}>
        Changer de formule
      </button>
    </div>
  )
}
