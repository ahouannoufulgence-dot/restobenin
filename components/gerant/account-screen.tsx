'use client'

import Link from 'next/link'
import { Check, CreditCard, Mail, Phone, Store, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Account } from '@/lib/account-store'
import type { ManagerView } from '@/lib/gerant-data'
import { ANNUAL_DISCOUNT, amountDue, formatFCFA, getPlan, monthlyPrice, teamLimits } from '@/lib/plans'
import { Panel, ScreenHeader, primaryAction } from './shared'

const date = (at: number) => new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-ember" strokeWidth={1.7} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="break-words text-sm font-medium">{value}</dd>
      </div>
    </div>
  )
}

export function AccountScreen({
  account,
  restaurantName,
  phone,
  memberCount,
  onNavigate,
}: {
  account: Account | null
  /** Nom et téléphone actuels (modifiables dans les paramètres) ; sinon ceux de l'inscription. */
  restaurantName: string
  phone: string
  memberCount: number
  onNavigate: (view: ManagerView) => void
}) {
  if (!account) {
    return (
      <>
        <ScreenHeader title="Abonnement" subtitle="Votre compte et votre formule." />
        <Panel className="text-center">
          <p className="font-serif text-xl font-semibold">Aucun compte créé</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Vous utilisez RestoBen en mode démonstration. Créez votre compte pour retrouver ici votre formule, votre facturation et les informations de votre restaurant.
          </p>
          <Link href="/inscription" className={cn(primaryAction, 'mt-5 w-full sm:w-auto')}>
            Créer mon compte
          </Link>
        </Panel>
      </>
    )
  }

  const plan = getPlan(account.planId)
  const annual = account.billing === 'annuel'
  const renewal = new Date(account.createdAt)
  if (annual) renewal.setFullYear(renewal.getFullYear() + 1)
  else renewal.setMonth(renewal.getMonth() + 1)
  const limit = teamLimits[account.planId]
  const usage = limit ? Math.min(100, Math.round((memberCount / limit) * 100)) : 0

  return (
    <>
      <ScreenHeader title="Abonnement" subtitle="Votre compte et votre formule." />

      <div className="grid gap-4 lg:max-w-3xl">
        <Panel className="p-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Formule {annual ? 'annuelle' : 'mensuelle'}</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold">{plan.name}</h2>
          <p className="text-sm text-muted-foreground">{plan.tagline}</p>

          <p className="mt-4 font-serif text-3xl font-semibold tabular-nums text-ember-deep">
            {formatFCFA(annual ? amountDue(plan, 'annuel') : plan.monthly)} <span className="text-lg">FCFA</span>
            <span className="ml-1 text-base font-sans font-normal text-muted-foreground">/ {annual ? 'an' : 'mois'}</span>
          </p>
          {annual && (
            <p className="mt-1 text-sm text-muted-foreground">
              Soit {formatFCFA(monthlyPrice(plan, 'annuel'))} FCFA par mois (−{Math.round(ANNUAL_DISCOUNT * 100)} %)
            </p>
          )}
          <p className="mt-3 text-sm">
            Activée le <span className="font-medium">{date(account.createdAt)}</span> · prochain renouvellement le <span className="font-medium">{date(renewal.getTime())}</span>
          </p>

          <div className="mt-4 rounded-xl bg-sand/60 p-3">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">Équipe</span>
              <span className="tabular-nums text-muted-foreground">
                {memberCount} / {limit ?? 'illimité'} membres
              </span>
            </div>
            {limit && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-label="Membres de l'équipe" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(memberCount, limit)}>
                <div className={cn('h-full rounded-full', usage >= 100 ? 'bg-destructive' : 'bg-ember')} style={{ width: `${usage}%` }} />
              </div>
            )}
          </div>

          <ul className="mt-4 grid gap-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-serif text-xl font-semibold">Votre restaurant</h2>
          <dl className="mt-1 divide-y divide-border">
            <Row icon={Store} label="Nom du restaurant" value={restaurantName || account.restaurant} />
            <Row icon={Store} label="Type d’établissement" value={account.establishment} />
            <Row icon={Phone} label="Téléphone" value={phone || account.phone} />
          </dl>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-serif text-xl font-semibold">Responsable du compte</h2>
          <dl className="mt-1 divide-y divide-border">
            <Row icon={UserRound} label="Nom" value={account.manager} />
            <Row icon={Mail} label="Adresse e-mail" value={account.email} />
            <Row icon={CreditCard} label="Mode de paiement" value={account.paymentMethod} />
          </dl>
        </Panel>

        <button
          type="button"
          onClick={() => onNavigate('parametres')}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
        >
          Modifier les informations du restaurant
        </button>
      </div>
    </>
  )
}
