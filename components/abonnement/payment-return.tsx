'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'

type State = 'checking' | 'payee' | 'echec' | 'waiting' | 'login' | 'invalid'

const POLL_MS = 3000
const MAX_TRIES = 30 // environ 90 secondes

/**
 * Page de retour après la page de paiement FedaPay. Elle ne croit rien de ce que FedaPay ajoute à l'adresse
 * (état, identifiant) : elle demande à NOTRE base l'état du paiement, que seul le serveur peut faire passer à « payé ».
 */
export function PaymentReturn({ paymentId }: { paymentId: string | null }) {
  const [state, setState] = useState<State>(paymentId ? 'checking' : 'invalid')

  useEffect(() => {
    if (!paymentId) return
    let off = false
    let tries = 0
    let timer: number | undefined
    const check = async () => {
      try {
        const sb = getSupabase()
        const { data } = await sb.auth.getSession()
        if (!data.session) return !off && setState('login')
        const { data: status, error } = await sb.rpc('payment_status', { p_payment: paymentId })
        if (off) return
        if (!error && status === 'payee') return setState('payee')
        if (!error && status === 'echec') return setState('echec')
        if (!error && status === null) return setState('invalid') // paiement inconnu ou d'un autre restaurant
      } catch {
        /* connexion coupée : on réessaie */
      }
      if (off) return
      if (++tries >= MAX_TRIES) return setState('waiting')
      timer = window.setTimeout(check, POLL_MS)
    }
    void check()
    return () => {
      off = true
      window.clearTimeout(timer)
    }
  }, [paymentId])

  const view = {
    checking: { icon: <Loader2 className="size-12 animate-spin text-ember" aria-hidden="true" />, title: 'Vérification du paiement…', text: 'Nous attendons la confirmation de FedaPay. Cela prend en général quelques secondes. Ne fermez pas cette page.' },
    payee: { icon: <CheckCircle2 className="size-12 text-success" aria-hidden="true" />, title: 'Paiement confirmé', text: 'Merci ! Votre abonnement est actif. Votre facture est disponible dans l’écran Abonnement.' },
    echec: { icon: <XCircle className="size-12 text-destructive" aria-hidden="true" />, title: 'Le paiement n’a pas abouti', text: 'Aucun montant n’a été débité par RestoBen. Vous pouvez réessayer depuis l’écran Abonnement.' },
    waiting: { icon: <Clock className="size-12 text-gold" aria-hidden="true" />, title: 'Confirmation en attente', text: 'FedaPay n’a pas encore confirmé votre paiement. Si vous avez bien validé le paiement sur votre téléphone, la confirmation peut prendre quelques minutes : votre abonnement s’activera tout seul. Vous pouvez fermer cette page.' },
    login: { icon: <XCircle className="size-12 text-muted-foreground" aria-hidden="true" />, title: 'Reconnectez-vous', text: 'Votre session a expiré. Reconnectez-vous pour voir l’état de votre paiement.' },
    invalid: { icon: <XCircle className="size-12 text-muted-foreground" aria-hidden="true" />, title: 'Paiement introuvable', text: 'Ce lien de paiement n’est pas valide. Retournez sur l’application pour voir l’état de votre abonnement.' },
  }[state]

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div role="status" aria-live="polite" className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]">
        <div className="flex justify-center">{view.icon}</div>
        <h1 className="mt-4 font-serif text-3xl font-semibold">{view.title}</h1>
        <p className="mt-2 text-muted-foreground">{view.text}</p>
        {state !== 'checking' && (
          <Link
            href={state === 'login' ? '/connexion' : '/gerant'}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-b from-ember to-ember-deep text-base font-semibold text-primary-foreground shadow-lg shadow-ember-deep/25 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40"
          >
            {state === 'login' ? 'Se connecter' : 'Ouvrir l’application'}
          </Link>
        )}
      </div>
    </main>
  )
}
