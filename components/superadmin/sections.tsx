'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Hourglass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa } from '@/lib/gerant-data'
import { DEMO_SUPERADMIN } from '@/lib/superadmin-auth'
import { friendlyError } from '@/lib/supabase/runtime'
import {
  confirmManualPayment,
  loadAuditLog,
  loadPaymentInfo,
  loadPayments,
  loadPendingPayments,
  loadPlans,
  loadRestaurants,
  loadSubscriptions,
  loadTickets,
  loadUsers,
  rejectManualPayment,
  savePaymentInfo,
  setRestaurantStatus,
  updateTicketStatus,
  type AuditRow,
  type OperatorKey,
  type PaymentInfo,
  type PaymentRow,
  type PendingPayment,
  type PlanRow,
  type RestaurantRow,
  type RestaurantStatus,
  type SubscriptionRow,
  type TicketRow,
  type TicketStatus,
  type UserRow,
} from '@/lib/superadmin-data'

const card = 'rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]'

const date = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')

type Tone = 'ok' | 'warn' | 'bad' | 'neutral'
const tones: Record<Tone, string> = {
  ok: 'bg-success/15 text-success',
  warn: 'bg-gold/20 text-[#6b4510]',
  bad: 'bg-destructive text-white',
  neutral: 'bg-[#efe6dc] text-foreground/75',
}
function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={cn('inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>
}
const subscriptionTone = (s: RestaurantStatus): Tone => (s === 'Actif' ? 'ok' : s === 'Suspendu' ? 'warn' : 'bad')

/** Charge des données au premier affichage ; `loader` doit être une fonction définie hors du composant. */
function useLoad<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let off = false
    loader()
      .then((d) => !off && setData(d))
      .catch((e: unknown) => !off && setError(friendlyError(e instanceof Error ? e.message : String(e))))
    return () => {
      off = true
    }
  }, [loader])
  return { data, setData, error }
}

type Col<T> = { header: string; cell: (row: T) => React.ReactNode; className?: string }

function Panel<T extends { id: string }>({ title, rows, cols, error, empty }: { title: string; rows: T[] | null; cols: Col<T>[]; error: string; empty: string }) {
  return (
    <section aria-label={title} className={cn(card, 'overflow-hidden')}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        {rows && <span className="text-sm text-muted-foreground">{rows.length}</span>}
      </div>
      {error && (
        <p role="alert" className="m-4 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          Impossible de charger les données : {error}
        </p>
      )}
      {!rows && !error && (
        <p role="status" className="px-5 py-8 text-center text-sm text-muted-foreground">
          Chargement des données…
        </p>
      )}
      {rows && rows.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted-foreground">{empty}</p>}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-xs text-foreground/80">
                {cols.map((c) => (
                  <th key={c.header} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:pl-5 last:pr-5">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border border-t border-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  {cols.map((c, i) => (
                    <td key={c.header} className={cn('px-3 py-3.5 first:pl-5 last:pr-5', i === 0 && 'font-medium', c.className)}>
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ sections */

function ConfirmStatusDialog({
  restaurant,
  onCancel,
  onConfirm,
}: {
  restaurant: RestaurantRow
  onCancel: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const suspending = restaurant.status === 'Actif'
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  async function confirm() {
    setBusy(true)
    setFailure('')
    try {
      await onConfirm(reason)
    } catch (e) {
      setFailure(friendlyError(e instanceof Error ? e.message : String(e)))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => !busy && onCancel()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-title"
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="status-title" className="font-serif text-2xl font-semibold">
          {suspending ? `Suspendre ${restaurant.name} ?` : `Réactiver ${restaurant.name} ?`}
        </h2>
        <p className="mt-2 text-sm text-foreground/80">
          {suspending
            ? 'Ses clients ne pourront plus commander, et son équipe passera en lecture seule : plus de commande, d’encaissement ni de modification, jusqu’à la réactivation. Vous pourrez la réactiver à tout moment.'
            : 'Le restaurant retrouvera tout de suite l’accès complet, et ses clients pourront de nouveau commander.'}
        </p>
        <label htmlFor="status-reason" className="mt-4 block text-sm font-medium">
          Motif <span className="font-normal text-muted-foreground">(facultatif, conservé dans le journal)</span>
        </label>
        <textarea
          id="status-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          rows={3}
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember focus:ring-3 focus:ring-ember/20"
        />
        {failure && (
          <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {failure}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={onCancel}
            className="h-11 rounded-lg border border-border text-sm font-semibold hover:border-ember disabled:opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirm()}
            className={cn(
              'h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40',
              suspending ? 'bg-destructive hover:bg-destructive/90' : 'bg-ember-deep hover:bg-ember-deep/90',
            )}
          >
            {busy ? 'En cours…' : suspending ? 'Suspendre' : 'Réactiver'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RestaurantsSection() {
  const { data, setData, error } = useLoad(loadRestaurants)
  const log = useLoad(loadAuditLog)
  const [target, setTarget] = useState<RestaurantRow | null>(null)
  const [notice, setNotice] = useState('')

  async function apply(restaurant: RestaurantRow, reason: string) {
    const next = restaurant.status === 'Actif' ? 'suspendu' : 'actif'
    await setRestaurantStatus(restaurant.id, next, reason) // lance une erreur si la base refuse : le dialogue l'affiche
    const status: RestaurantStatus = next === 'suspendu' ? 'Suspendu' : 'Actif'
    setData((rows) => rows && rows.map((r) => (r.id === restaurant.id ? { ...r, status } : r)))
    log.setData((rows) => [
      { id: `local-${Date.now()}`, action: next === 'suspendu' ? 'suspension' : 'reactivation', restaurant: restaurant.name, reason: reason.trim(), createdAt: new Date().toISOString() } as AuditRow,
      ...(rows ?? []),
    ])
    setNotice(`${restaurant.name} est maintenant ${status === 'Actif' ? 'actif' : 'suspendu'}.`)
    setTarget(null)
  }

  return (
    <div className="grid gap-6">
      {notice && (
        <p role="status" className="rounded-xl bg-success/15 p-3 text-sm font-medium text-success">
          {notice}
        </p>
      )}
      <Panel<RestaurantRow>
        title="Tous les restaurants"
        rows={data}
        error={error}
        empty="Aucun restaurant pour le moment."
        cols={[
          { header: 'Restaurant', cell: (r) => r.name },
          { header: 'Adresse', cell: (r) => r.address },
          { header: 'Gérant', cell: (r) => r.owner },
          { header: 'Formule', cell: (r) => <Pill tone="neutral">{r.plan}</Pill> },
          { header: 'Statut', cell: (r) => <Pill tone={subscriptionTone(r.status)}>{r.status}</Pill> },
          { header: 'Tables', cell: (r) => r.tables, className: 'tabular-nums' },
          { header: 'Inscrit le', cell: (r) => date(r.createdAt), className: 'whitespace-nowrap' },
          {
            header: 'Action',
            cell: (r) =>
              r.status === 'Résilié' ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNotice('')
                    setTarget(r)
                  }}
                  className={cn(
                    'h-9 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30',
                    r.status === 'Actif' ? 'border-destructive/40 text-destructive hover:bg-destructive/10' : 'border-border hover:border-ember hover:text-ember',
                  )}
                >
                  {r.status === 'Actif' ? 'Suspendre' : 'Réactiver'}
                </button>
              ),
          },
        ]}
      />
      <Panel<AuditRow>
        title="Journal des actions"
        rows={log.data}
        error={log.error}
        empty="Aucune suspension ni réactivation pour le moment."
        cols={[
          { header: 'Date', cell: (a) => new Date(a.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', ''), className: 'whitespace-nowrap' },
          { header: 'Action', cell: (a) => <Pill tone={a.action === 'suspension' ? 'warn' : 'ok'}>{a.action === 'suspension' ? 'Suspension' : 'Réactivation'}</Pill> },
          { header: 'Restaurant', cell: (a) => a.restaurant },
          { header: 'Motif', cell: (a) => a.reason || '—', className: 'min-w-40' },
        ]}
      />
      {target && <ConfirmStatusDialog restaurant={target} onCancel={() => setTarget(null)} onConfirm={(reason) => apply(target, reason)} />}
    </div>
  )
}

function SubscriptionsSection() {
  const { data, error } = useLoad(loadSubscriptions)
  return (
    <Panel<SubscriptionRow>
      title="Abonnements"
      rows={data}
      error={error}
      empty="Aucun abonnement pour le moment."
      cols={[
        { header: 'Restaurant', cell: (r) => r.name },
        { header: 'Formule', cell: (r) => <Pill tone="neutral">{r.plan}</Pill> },
        { header: 'Facturation', cell: (r) => r.billing },
        { header: 'Montant / mois', cell: (r) => fcfa(r.monthlyFcfa), className: 'whitespace-nowrap tabular-nums' },
        { header: 'Paiement', cell: (r) => r.paymentMethod },
        { header: 'Statut', cell: (r) => <Pill tone={subscriptionTone(r.status)}>{r.status}</Pill> },
        { header: 'Dernier changement', cell: (r) => date(r.changedAt), className: 'whitespace-nowrap' },
      ]}
    />
  )
}

const paymentLabel: Record<PaymentRow['status'], [string, Tone]> = { payee: ['Payée', 'ok'], en_attente: ['En attente', 'warn'], echec: ['Échec', 'bad'] }

/** Fenêtre de décision sur un paiement manuel : valider (en saisissant le montant reçu) ou refuser. */
function PaymentDecisionDialog({ payment, mode, onCancel, onDone }: { payment: PendingPayment; mode: 'confirm' | 'reject'; onCancel: () => void; onDone: (message: string) => void }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const confirming = mode === 'confirm'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  async function submit() {
    setFailure('')
    if (confirming && !/^\d+$/.test(value.trim())) return setFailure('Saisissez le montant reçu, en chiffres.')
    setBusy(true)
    try {
      if (confirming) await confirmManualPayment(payment.id, Number(value.trim()))
      else await rejectManualPayment(payment.id, value)
      onDone(confirming ? `Paiement de ${payment.restaurant} validé : l’accès est prolongé.` : `Paiement de ${payment.restaurant} refusé.`)
    } catch (e) {
      setFailure(friendlyError(e instanceof Error ? e.message : String(e)))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => !busy && onCancel()}>
      <div role="dialog" aria-modal="true" aria-labelledby="decision-title" className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="decision-title" className="font-serif text-2xl font-semibold">
          {confirming ? 'Valider ce paiement ?' : 'Refuser ce paiement ?'}
        </h2>
        <dl className="mt-3 grid gap-1 rounded-xl bg-sand/60 p-3 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Restaurant</dt><dd className="font-medium">{payment.restaurant}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Formule</dt><dd className="font-medium capitalize">{payment.plan} · {payment.billing}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Montant attendu</dt><dd className="font-medium tabular-nums">{fcfa(payment.amountFcfa)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">N° de transaction</dt><dd className="break-all font-mono font-medium">{payment.ref}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Envoyé depuis</dt><dd className="font-medium">{payment.payerPhone}</dd></div>
        </dl>
        {confirming ? (
          <>
            <p className="mt-3 text-sm text-foreground/80">Vérifiez dans votre application Mobile Money que ce numéro de transaction figure bien dans vos messages, puis saisissez le montant que vous avez réellement reçu.</p>
            <label htmlFor="decision-value" className="mt-3 block text-sm font-medium">Montant reçu (FCFA)</label>
            <input id="decision-value" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="ex. 25000" className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-ember focus:ring-3 focus:ring-ember/20" />
          </>
        ) : (
          <>
            <label htmlFor="decision-value" className="mt-3 block text-sm font-medium">Motif <span className="font-normal text-muted-foreground">(montré au gérant)</span></label>
            <textarea id="decision-value" value={value} onChange={(e) => setValue(e.target.value)} maxLength={300} rows={3} placeholder="ex. Aucun message reçu pour ce numéro de transaction." className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember focus:ring-3 focus:ring-ember/20" />
          </>
        )}
        {failure && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{failure}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" autoFocus disabled={busy} onClick={onCancel} className="h-11 rounded-lg border border-border text-sm font-semibold hover:border-ember disabled:opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">Annuler</button>
          <button type="button" disabled={busy} onClick={() => void submit()} className={cn('h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40', confirming ? 'bg-ember-deep hover:bg-ember-deep/90' : 'bg-destructive hover:bg-destructive/90')}>
            {busy ? 'En cours…' : confirming ? 'Valider' : 'Refuser'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PaymentsSection() {
  const [version, setVersion] = useState(0)
  const loader = useCallback(() => loadPayments(), [version]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data, error } = useLoad(loader)
  const pending = useLoad(loadPendingPayments)
  const [target, setTarget] = useState<{ payment: PendingPayment; mode: 'confirm' | 'reject' } | null>(null)
  const [notice, setNotice] = useState('')

  return (
    <div className="grid gap-6">
      {notice && <p role="status" className="rounded-xl bg-success/15 p-3 text-sm font-medium text-success">{notice}</p>}
      <Panel<PendingPayment>
        title="Paiements à valider"
        rows={pending.data}
        error={pending.error}
        empty="Aucun paiement en attente de validation."
        cols={[
          { header: 'Restaurant', cell: (p) => p.restaurant },
          { header: 'Formule', cell: (p) => <span className="capitalize">{p.plan} · {p.billing}</span>, className: 'whitespace-nowrap' },
          { header: 'Montant attendu', cell: (p) => fcfa(p.amountFcfa), className: 'whitespace-nowrap tabular-nums' },
          { header: 'N° de transaction', cell: (p) => <span className="break-all font-mono">{p.ref}</span> },
          { header: 'Envoyé depuis', cell: (p) => p.payerPhone, className: 'whitespace-nowrap' },
          { header: 'Déclaré le', cell: (p) => new Date(p.submittedAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', ''), className: 'whitespace-nowrap' },
          {
            header: 'Action',
            cell: (p) => (
              <span className="flex gap-2">
                <button type="button" onClick={() => { setNotice(''); setTarget({ payment: p, mode: 'confirm' }) }} className="h-9 whitespace-nowrap rounded-lg bg-ember-deep px-3 text-xs font-semibold text-white hover:bg-ember-deep/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40">Valider</button>
                <button type="button" onClick={() => { setNotice(''); setTarget({ payment: p, mode: 'reject' }) }} className="h-9 whitespace-nowrap rounded-lg border border-destructive/40 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">Refuser</button>
              </span>
            ),
          },
        ]}
      />
      <Panel<PaymentRow>
        title="Paiements d’abonnement"
        rows={data}
        error={error}
        empty="Aucun paiement pour le moment."
        cols={[
          { header: 'Facture', cell: (r) => r.invoice, className: 'whitespace-nowrap' },
          { header: 'Restaurant', cell: (r) => r.restaurant },
          { header: 'Formule', cell: (r) => <span className="capitalize">{r.plan}</span> },
          { header: 'Montant', cell: (r) => fcfa(r.amountFcfa), className: 'whitespace-nowrap tabular-nums' },
          { header: 'Moyen', cell: (r) => r.method },
          { header: 'Période', cell: (r) => `${date(r.periodStart)} → ${date(r.periodEnd)}`, className: 'whitespace-nowrap' },
          { header: 'Statut', cell: (r) => <Pill tone={paymentLabel[r.status][1]}>{paymentLabel[r.status][0]}</Pill> },
        ]}
      />
      {target && (
        <PaymentDecisionDialog
          payment={target.payment}
          mode={target.mode}
          onCancel={() => setTarget(null)}
          onDone={(message) => {
            pending.setData((rows) => (rows ?? []).filter((r) => r.id !== target.payment.id))
            setVersion((v) => v + 1)
            setNotice(message)
            setTarget(null)
          }}
        />
      )}
    </div>
  )
}

const ticketOptions: { value: TicketStatus; label: string }[] = [
  { value: 'ouvert', label: 'Ouvert' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'resolu', label: 'Résolu' },
]

function SupportSection() {
  const { data, setData, error } = useLoad(loadTickets)
  const [message, setMessage] = useState('')

  async function change(id: string, status: TicketStatus) {
    if (!data) return
    const previous = data
    setMessage('')
    setData(data.map((t) => (t.id === id ? { ...t, status } : t)))
    const failure = await updateTicketStatus(id, status)
    if (failure) {
      setData(previous)
      setMessage(`Le ticket n’a pas pu être modifié : ${friendlyError(failure)}`)
    }
  }

  return (
    <>
      {message && (
        <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {message}
        </p>
      )}
      <Panel<TicketRow>
        title="Tickets support"
        rows={data}
        error={error}
        empty="Aucun ticket pour le moment."
        cols={[
          {
            header: 'Sujet',
            cell: (t) => (
              <span className="block min-w-48 max-w-md">
                <span className="block">{t.subject}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs font-normal text-muted-foreground">{t.message}</span>
              </span>
            ),
          },
          { header: 'Restaurant', cell: (t) => t.restaurant },
          { header: 'Reçu le', cell: (t) => date(t.createdAt), className: 'whitespace-nowrap' },
          {
            header: 'Statut',
            cell: (t) => (
              <>
                <label htmlFor={`ticket-${t.id}`} className="sr-only">
                  Statut du ticket {t.subject}
                </label>
                <select
                  id={`ticket-${t.id}`}
                  value={t.status}
                  onChange={(e) => void change(t.id, e.target.value as TicketStatus)}
                  className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ember focus:ring-3 focus:ring-ember/20"
                >
                  {ticketOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </>
            ),
          },
        ]}
      />
    </>
  )
}

const roleLabel: Record<string, string> = { gerant: 'Gérant', chef: 'Chef', cuisinier: 'Cuisinier', serveur: 'Serveur', caissier: 'Caissier', stockiste: 'Stockiste' }

function UsersSection() {
  const { data, error } = useLoad(loadUsers)
  return (
    <Panel<UserRow>
      title="Gérants et employés"
      rows={data}
      error={error}
      empty="Aucun utilisateur pour le moment."
      cols={[
        { header: 'Nom', cell: (u) => u.name },
        { header: 'Rôle', cell: (u) => roleLabel[u.role] ?? u.role },
        { header: 'Restaurant', cell: (u) => u.restaurant },
        { header: 'E-mail', cell: (u) => u.email },
        { header: 'Téléphone', cell: (u) => u.phone, className: 'whitespace-nowrap' },
        { header: 'Statut', cell: (u) => <Pill tone={u.status === 'actif' ? 'ok' : 'warn'}>{u.status === 'actif' ? 'Actif' : 'En congé'}</Pill> },
      ]}
    />
  )
}

const NUMBER_FIELDS: { key: OperatorKey; label: string }[] = [
  { key: 'mtn', label: 'MTN MoMo' },
  { key: 'celtiis', label: 'Celtiis Cash' },
  { key: 'moov', label: 'Moov Money' },
]

function PaymentInfoPanel() {
  const { data, error } = useLoad(loadPaymentInfo)
  const [form, setForm] = useState({ mtn: '', celtiis: '', moov: '', holder: '', note: '' })
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (data && !loaded) {
      const phone = (k: OperatorKey) => data.numbers.find((n) => n.operator === k)?.phone ?? ''
      setForm({ mtn: phone('mtn'), celtiis: phone('celtiis'), moov: phone('moov'), holder: data.holder, note: data.note })
      setLoaded(true)
    }
  }, [data, loaded])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const field = 'mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ember focus:ring-3 focus:ring-ember/20'

  async function save() {
    setMessage(null)
    const numbers = NUMBER_FIELDS.flatMap(({ key }) => (form[key].trim() ? [{ operator: key, phone: form[key].trim() }] : []))
    if (numbers.length === 0) return setMessage({ ok: false, text: 'Saisissez au moins un numéro.' })
    setBusy(true)
    try {
      await savePaymentInfo({ numbers, holder: form.holder, note: form.note })
      setMessage({ ok: true, text: 'Enregistré : chaque gérant voit le numéro de son réseau au moment de payer.' })
    } catch (e) {
      setMessage({ ok: false, text: friendlyError(e instanceof Error ? e.message : String(e)) })
    }
    setBusy(false)
  }

  return (
    <section aria-label="Coordonnées de paiement" className={cn(card, 'overflow-hidden')}>
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-serif text-xl font-semibold">Où les restaurants vous paient</h2>
        <p className="mt-1 text-sm text-muted-foreground">Un numéro par réseau : le gérant paie sur celui de son propre réseau, ce qui est plus simple pour lui. Laissez vide un réseau dont vous n’avez pas de numéro. Il en faut au moins un.</p>
      </div>
      <div className="grid gap-4 p-5">
        {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">Impossible de charger : {error}</p>}
        {!data && !error && <p role="status" className="text-sm text-muted-foreground">Chargement…</p>}
        {data === null && !error && <p role="status" className="rounded-xl bg-gold/15 p-3 text-sm font-medium text-[#6b4510]">Aucun numéro saisi pour le moment : les gérants ne peuvent pas encore payer.</p>}
        {NUMBER_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label htmlFor={`pi-${key}`} className="block text-sm font-medium">Numéro {label}</label>
            <input id={`pi-${key}`} value={form[key]} onChange={set(key)} inputMode="tel" maxLength={20} placeholder="01 00 00 00 00" className={field} />
          </div>
        ))}
        <div>
          <label htmlFor="pi-holder" className="block text-sm font-medium">Nom du titulaire <span className="font-normal text-muted-foreground">(affiché pour que le gérant vérifie avant d’envoyer)</span></label>
          <input id="pi-holder" value={form.holder} onChange={set('holder')} maxLength={80} className={field} />
        </div>
        <div>
          <label htmlFor="pi-note" className="block text-sm font-medium">Consigne <span className="font-normal text-muted-foreground">(facultatif)</span></label>
          <textarea id="pi-note" value={form.note} onChange={set('note')} maxLength={300} rows={2} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember focus:ring-3 focus:ring-ember/20" />
        </div>
        {message && <p role={message.ok ? 'status' : 'alert'} className={cn('rounded-xl p-3 text-sm font-medium', message.ok ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive')}>{message.text}</p>}
        <button type="button" onClick={() => void save()} disabled={busy} className="h-11 rounded-lg bg-ember-deep text-sm font-semibold text-white hover:bg-ember-deep/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40">
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </section>
  )
}

function SettingsSection() {
  const { data, error } = useLoad(loadPlans)
  return (
    <div className="grid gap-6">
      <PaymentInfoPanel />
      <div>
        <Panel<PlanRow>
          title="Formules et tarifs"
          rows={data}
          error={error}
          empty="Aucune formule."
          cols={[
            { header: 'Formule', cell: (p) => p.name },
            { header: 'Prix mensuel', cell: (p) => fcfa(p.monthlyFcfa), className: 'whitespace-nowrap tabular-nums' },
            { header: 'Prix par mois en annuel (−20 %)', cell: (p) => fcfa(Math.round(p.monthlyFcfa * 0.8)), className: 'whitespace-nowrap tabular-nums' },
            { header: 'Limite d’équipe', cell: (p) => (p.teamLimit === null ? 'Illimitée' : `${p.teamLimit} personnes`) },
          ]}
        />
        <p className="mt-3 text-sm text-muted-foreground">Affichage en lecture seule. La modification des tarifs n’est pas encore disponible.</p>
      </div>
    </div>
  )
}

function ComingSoon({ description, note }: { description: string; note: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-[#f6e6d3] text-[#b8741a]">
        <Hourglass className="size-7" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-serif text-2xl font-semibold">Section à venir</h2>
      <p className="mt-2 text-foreground/80">{description}</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      <Link href="/superadmin" className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Retour au tableau de bord
      </Link>
    </div>
  )
}

export function SuperAdminSectionContent({ slug, description }: { slug: string; description: string }) {
  if (DEMO_SUPERADMIN) return <ComingSoon description={description} note="Elle sera disponible une fois la base de données branchée." />
  switch (slug) {
    case 'restaurants':
      return <RestaurantsSection />
    case 'abonnements':
      return <SubscriptionsSection />
    case 'paiements':
      return <PaymentsSection />
    case 'support':
      return <SupportSection />
    case 'utilisateurs':
      return <UsersSection />
    case 'parametres':
      return <SettingsSection />
    default:
      return <ComingSoon description={description} note="Cette section sera disponible prochainement." />
  }
}
