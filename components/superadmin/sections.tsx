'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Hourglass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa } from '@/lib/gerant-data'
import { DEMO_SUPERADMIN } from '@/lib/superadmin-auth'
import { friendlyError } from '@/lib/supabase/runtime'
import {
  loadPayments,
  loadPlans,
  loadRestaurants,
  loadSubscriptions,
  loadTickets,
  loadUsers,
  updateTicketStatus,
  type PaymentRow,
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

function RestaurantsSection() {
  const { data, error } = useLoad(loadRestaurants)
  return (
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
      ]}
    />
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

function PaymentsSection() {
  const { data, error } = useLoad(loadPayments)
  return (
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

function SettingsSection() {
  const { data, error } = useLoad(loadPlans)
  return (
    <>
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
    </>
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
