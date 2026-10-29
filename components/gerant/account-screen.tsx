'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Crown,
  Download,
  Headset,
  Mail,
  Package,
  BarChart3,
  Phone,
  Soup,
  Star,
  Store,
  Tag,
  UserRound,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Account, billingPeriod, changePlan, updateAccount } from '@/lib/account-store'
import type { ManagerView } from '@/lib/gerant-data'
import { exportInvoicePdf } from '@/lib/invoice-pdf'
import {
  ANNUAL_DISCOUNT,
  PAYMENTS_SIMULATED,
  type Billing,
  type PlanId,
  amountDue,
  formatFCFA,
  getPlan,
  monthlyPrice,
  planComparison,
  planHighlights,
  plans,
  teamLimits,
} from '@/lib/plans'
import { paymentMethodLabels } from '@/components/inscription/payment-step'
import { BrandMark } from './dashboard-screen'
import { Modal } from './shared'

const day = (at: number) => new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const fcfa = (v: number) => formatFCFA(v).replace(/[\u202f\u00a0]/g, ' ')

const card = 'rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]'
const focusRing = 'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30'

const order: PlanId[] = ['basique', 'standard', 'premium']
const planIcon: Record<PlanId, { icon: LucideIcon; circle: string }> = {
  basique: { icon: Soup, circle: 'bg-sand text-[#7a5526]' },
  standard: { icon: Star, circle: 'bg-ember-deep text-white [&_svg]:fill-white' },
  premium: { icon: Crown, circle: 'bg-[#f3e2b8] text-[#9a6f2e]' },
}
const rowIcon = { equipe: Users, stocks: Package, rapports: BarChart3, support: Headset, facturation: CreditCard } as const

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-ember-deep min-[380px]:tracking-[0.18em]">{children}</h2>
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
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

function OutlineRow({ icon: Icon, label, onClick, disabled }: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(card, 'flex h-14 w-full items-center gap-3 px-4 text-base font-medium transition-colors hover:border-ember disabled:opacity-60', focusRing)}
    >
      <Icon className="size-6 shrink-0 text-[#9a6f2e]" strokeWidth={1.5} aria-hidden="true" />
      <span className="flex-1 text-center">{label}</span>
      <ChevronRight className="size-5 shrink-0 text-[#9a6f2e]" aria-hidden="true" />
    </button>
  )
}

export function AccountScreen({
  account,
  restaurantName,
  phone,
  memberCount,
  notifications,
  onNavigate,
  onSupport,
}: {
  account: Account | null
  /** Nom et téléphone actuels (modifiables dans les paramètres) ; sinon ceux de l'inscription. */
  restaurantName: string
  phone: string
  memberCount: number
  /** Nombre de commandes en attente (point sur la cloche). */
  notifications: number
  onNavigate: (view: ManagerView) => void
  onSupport: () => void
}) {
  // Sans compte (mode démonstration), on montre un aperçu de la formule Standard.
  const [demoStart] = useState(() => Date.now())
  const real = account !== null
  const shown: Account = account ?? {
    restaurant: restaurantName,
    manager: '',
    email: '',
    phone,
    establishment: '',
    planId: 'standard',
    billing: 'mensuel',
    paymentMethod: 'MTN Mobile Money',
    createdAt: demoStart,
  }

  const [selected, setSelected] = useState<PlanId | null>(null)
  const [dialog, setDialog] = useState<null | 'plan' | 'payment'>(null)
  const [notice, setNotice] = useState('')
  const [invoiceBusy, setInvoiceBusy] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  const plan = getPlan(shown.planId)
  const annual = shown.billing === 'annuel'
  const { next } = billingPeriod(shown)
  const currentIndex = order.indexOf(shown.planId)
  const defaultTarget: PlanId | null = order[currentIndex + 1] ?? null
  const target: PlanId | null = selected && selected !== shown.planId ? selected : selected === shown.planId ? null : defaultTarget
  const targetIndex = target ? order.indexOf(target) : -1
  const isUpgrade = target !== null && targetIndex > currentIndex

  const needAccount = () => setNotice('Créez votre compte pour gérer votre abonnement.')

  async function downloadInvoice() {
    if (!real) return needAccount()
    setInvoiceBusy(true)
    setNotice('')
    try {
      await exportInvoicePdf(shown, restaurantName, phone, PAYMENTS_SIMULATED)
    } catch {
      setNotice('Impossible de générer la facture. Réessayez.')
    } finally {
      setInvoiceBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center lg:hidden">
        <div className="flex items-center gap-2 text-gold">
          <BrandMark className="size-10 shrink-0" />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-3xl font-medium text-foreground">RestoBen</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-foreground/80">Manager</span>
          </span>
        </div>
      </div>

      <header className="mt-3 flex items-center justify-between gap-2 border-b border-border pb-3 lg:mt-0">
        <button type="button" onClick={() => onNavigate('plus')} aria-label="Retour" className={cn('inline-flex size-11 items-center justify-center rounded-full text-ember-deep hover:bg-muted/60', focusRing)}>
          <ChevronLeft className="size-8" strokeWidth={1.6} aria-hidden="true" />
        </button>
        <h1 className="text-center font-serif text-4xl font-medium leading-tight sm:text-5xl">Abonnement</h1>
        <button type="button" onClick={() => onNavigate('commandes')} aria-label={`Notifications, ${notifications} commande${notifications > 1 ? 's' : ''} en attente`} className={cn('relative inline-flex size-11 items-center justify-center rounded-full text-ember-deep hover:bg-muted/60', focusRing)}>
          <Bell className="size-7" strokeWidth={1.6} aria-hidden="true" />
          {notifications > 0 && <span className="absolute right-2.5 top-2 size-2.5 rounded-full bg-ember-deep ring-2 ring-background" />}
        </button>
      </header>

      {!real && (
        <p className="mt-4 rounded-xl bg-gold/15 p-3 text-center text-sm leading-relaxed text-[#6b4510]">
          Aperçu de démonstration.{' '}
          <Link href="/inscription" className="font-semibold underline underline-offset-2">
            Créez votre compte
          </Link>{' '}
          pour gérer votre vrai abonnement.
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 rounded-xl bg-success/12 p-3 text-center text-sm font-medium text-success">
          {notice}
        </p>
      )}

      {/* Plan actuel */}
      <SectionLabel>Plan actuel</SectionLabel>
      <section aria-label="Plan actuel" className="flex items-center gap-2.5 rounded-2xl border border-gold/50 bg-gradient-to-br from-[#fdeedd] to-card p-3 shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)] sm:gap-4 sm:p-4">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-ember-deep text-white sm:size-16">
          <Crown className="size-6 sm:size-8" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap text-[15px] font-medium sm:text-lg">
            Plan actuel : <span className="text-ember-deep">{plan.name}</span>
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] sm:gap-2 sm:text-sm">
            <Tag className="size-4 shrink-0 text-foreground/70" strokeWidth={1.6} aria-hidden="true" />
            <span className="whitespace-nowrap">
              Prix : {fcfa(annual ? amountDue(plan, 'annuel') : plan.monthly)} FCFA / {annual ? 'an' : 'mois'}
            </span>
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-[12.5px] sm:gap-2 sm:text-sm">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-foreground/70" strokeWidth={1.6} aria-hidden="true" />
            <span>Prochain paiement : {day(next)}</span>
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 self-center rounded-full border border-success/60 bg-success/10 px-2 py-1 text-xs font-medium text-success max-[359px]:hidden sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-sm">
          <CheckCircle2 className="size-4 sm:size-5" aria-hidden="true" />
          Actif
        </span>
      </section>

      {/* Changer de formule */}
      <SectionLabel>Changer de formule</SectionLabel>
      <div className="grid grid-cols-3 gap-2 pt-3 max-[359px]:grid-cols-1 sm:gap-3">
        {order.map((id) => {
          const p = getPlan(id)
          const { icon: Icon, circle } = planIcon[id]
          const current = id === shown.planId
          const chosen = !current && target === id && selected === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              aria-pressed={current || chosen}
              aria-label={`Formule ${p.name}, ${fcfa(p.monthly)} FCFA par mois${current ? ', votre offre' : ''}`}
              className={cn(
                'relative flex min-w-0 flex-col items-start rounded-2xl border bg-card px-2 pb-3 pt-4 text-left shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)] transition-colors sm:px-4',
                current ? 'border-ember bg-gradient-to-b from-[#fff3e6] to-card' : chosen ? 'border-ember/70' : 'border-border hover:border-ember/60',
                focusRing,
              )}
            >
              {(current || chosen) && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ember px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  {current ? 'Votre offre' : 'Choisie'}
                </span>
              )}
              <span className={cn('w-full text-center font-serif text-xl leading-tight', current && 'text-ember-deep')}>{p.name}</span>
              <span className={cn('mt-2 inline-flex size-10 items-center justify-center rounded-full', circle)}>
                <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span className="mt-2 w-full text-center">
                <span className="block whitespace-nowrap text-[15px] font-semibold tabular-nums min-[400px]:text-base">{fcfa(p.monthly)} FCFA</span>
                <span className="block text-xs text-foreground/75">/mois</span>
              </span>
              <ul className="mt-2 grid gap-1.5">
                {planHighlights[id].map((f) => (
                  <li key={f} className="flex items-start gap-1 text-[10.5px] leading-snug min-[400px]:gap-1.5 min-[400px]:text-[11.5px]">
                    <Check className="mt-px size-3.5 shrink-0 rounded-full bg-success p-0.5 text-white" strokeWidth={3.5} aria-hidden="true" />
                    <span className="min-w-0">{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {/* Comparatif */}
      <div className={cn(card, 'mt-4 overflow-hidden')}>
        <table className="w-full table-fixed border-collapse text-[11.5px] min-[400px]:text-xs sm:text-sm">
          <caption className="sr-only">Comparatif des formules</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[30%] border-b border-border p-2 text-left font-medium"><span className="sr-only">Critère</span></th>
              {order.map((id) => (
                <th key={id} scope="col" className={cn('border-b border-l border-border p-2 text-center font-medium', id === shown.planId && 'text-ember-deep')}>
                  {getPlan(id).name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planComparison.map((row, r) => {
              const Icon = rowIcon[row.key]
              return (
                <tr key={row.key}>
                  <th scope="row" className={cn('p-2 text-left font-normal', r > 0 && 'border-t border-border')}>
                    <span className="flex items-center gap-1.5">
                      <Icon className="size-4 shrink-0 text-foreground/70 max-[379px]:hidden" strokeWidth={1.5} aria-hidden="true" />
                      <span className="min-w-0 break-words">{row.label}</span>
                    </span>
                  </th>
                  {row.values.every((v) => v === row.values[0]) ? (
                    <td colSpan={3} className={cn('border-l border-border p-2 text-center', r > 0 && 'border-t')}>
                      {row.values[0]}
                    </td>
                  ) : (
                    row.values.map((v, i) => (
                      <td key={i} className={cn('border-l border-border p-2 text-center', r > 0 && 'border-t', order[i] === shown.planId && 'bg-[#fff3e6]/70 font-medium')}>
                        {v}
                      </td>
                    ))
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="mt-4 grid gap-2.5">
        <button
          type="button"
          onClick={() => (real ? (target ? setDialog('plan') : undefined) : needAccount())}
          disabled={real && !target}
          className={cn(
            'flex h-14 w-full items-center gap-3 rounded-xl bg-gradient-to-b from-ember to-ember-deep px-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-ember-deep/30 transition-colors hover:from-ember-deep hover:to-ember-deep disabled:opacity-60',
            focusRing,
          )}
        >
          <Crown className="size-6 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          <span className="flex-1 text-center">
            {!target ? 'Formule la plus complète' : isUpgrade ? 'Mettre à niveau' : `Passer à ${getPlan(target).name}`}
          </span>
          <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
        </button>
        <OutlineRow icon={CreditCard} label="Gérer le paiement" onClick={() => (real ? setDialog('payment') : needAccount())} />
        <OutlineRow icon={Download} label={invoiceBusy ? 'Création de la facture…' : 'Télécharger la facture'} onClick={downloadInvoice} disabled={invoiceBusy} />

        {real && (
          <div className={cn(card, 'overflow-hidden')}>
            <button type="button" onClick={() => setInfoOpen((o) => !o)} aria-expanded={infoOpen} className={cn('flex h-14 w-full items-center gap-3 px-4 text-base font-medium', focusRing)}>
              <Store className="size-6 shrink-0 text-[#9a6f2e]" strokeWidth={1.5} aria-hidden="true" />
              <span className="flex-1 text-center">Informations du compte</span>
              <ChevronDown className={cn('size-5 shrink-0 text-[#9a6f2e] transition-transform', infoOpen && 'rotate-180')} aria-hidden="true" />
            </button>
            {infoOpen && (
              <dl className="divide-y divide-border border-t border-border px-4">
                <InfoRow icon={Store} label="Restaurant" value={`${restaurantName || shown.restaurant} · ${shown.establishment}`} />
                <InfoRow icon={Phone} label="Téléphone" value={phone || shown.phone} />
                <InfoRow icon={UserRound} label="Responsable" value={shown.manager} />
                <InfoRow icon={Mail} label="Adresse e-mail" value={shown.email} />
                <InfoRow icon={CreditCard} label="Mode de paiement" value={shown.paymentMethod} />
                <InfoRow icon={Users} label="Équipe" value={`${memberCount} / ${teamLimits[shown.planId] ?? 'illimité'} membres`} />
                <div className="py-3">
                  <button type="button" onClick={() => onNavigate('parametres')} className={cn('text-sm font-semibold text-ember-deep hover:underline', focusRing)}>
                    Modifier les informations du restaurant
                  </button>
                </div>
              </dl>
            )}
          </div>
        )}
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-sm">
        <CircleHelp className="size-6 shrink-0 text-[#9a6f2e]" strokeWidth={1.4} aria-hidden="true" />
        <span>
          Besoin d’aide ?{' '}
          <button type="button" onClick={onSupport} className={cn('font-medium text-ember-deep hover:underline', focusRing)}>
            Contactez le support
          </button>
        </span>
      </p>
      <div className="mx-auto mt-3 flex w-44 items-center gap-2 text-gold" aria-hidden="true">
        <span className="h-px flex-1 bg-gold/60" />
        <span className="size-1.5 rotate-45 bg-gold" />
        <span className="h-px flex-1 bg-gold/60" />
      </div>

      {dialog === 'plan' && target && real && (
        <PlanDialog
          account={shown}
          targetId={target}
          memberCount={memberCount}
          onClose={() => setDialog(null)}
          onDone={(message) => {
            setDialog(null)
            setSelected(null)
            setNotice(message)
          }}
        />
      )}
      {dialog === 'payment' && real && (
        <PaymentDialog
          account={shown}
          onClose={() => setDialog(null)}
          onDone={(message) => {
            setDialog(null)
            setNotice(message)
          }}
        />
      )}
    </div>
  )
}

function PlanDialog({ account, targetId, memberCount, onClose, onDone }: { account: Account; targetId: PlanId; memberCount: number; onClose: () => void; onDone: (message: string) => void }) {
  const [billing, setBilling] = useState<Billing>(account.billing)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const target = getPlan(targetId)
  const current = getPlan(account.planId)
  const up = plans.findIndex((p) => p.id === targetId) > plans.findIndex((p) => p.id === account.planId)
  const limit = teamLimits[targetId]
  const tooMany = limit !== null && memberCount > limit
  const nextDate = billingPeriod({ createdAt: Date.now(), billing }).next

  async function confirm() {
    if (tooMany) return setError(`Votre équipe compte ${memberCount} membres, la formule ${target.name} en autorise ${limit}. Retirez des membres dans Employés avant de changer.`)
    setBusy(true)
    const result = await changePlan(targetId, billing)
    setBusy(false)
    if (!result.ok) return setError(result.error)
    onDone(`Votre formule est maintenant ${target.name}.`)
  }

  return (
    <Modal title={up ? `Passer à ${target.name}` : `Revenir à ${target.name}`} onClose={onClose}>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Formule actuelle</dt>
          <dd className="font-medium">{current.name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Nouvelle formule</dt>
          <dd className="font-semibold text-ember-deep">{target.name}</dd>
        </div>
      </dl>

      <div role="radiogroup" aria-label="Facturation" className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
        {(['mensuel', 'annuel'] as const).map((b) => (
          <button
            key={b}
            type="button"
            role="radio"
            aria-checked={billing === b}
            onClick={() => setBilling(b)}
            className={cn('h-11 rounded-lg text-sm font-semibold transition-colors', billing === b ? 'bg-ember text-primary-foreground shadow-md shadow-ember/25' : 'text-foreground/80 hover:bg-muted/60', focusRing)}
          >
            {b === 'mensuel' ? 'Mensuelle' : `Annuelle −${Math.round(ANNUAL_DISCOUNT * 100)} %`}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-sand/60 p-4 text-center">
        <p className="font-serif text-3xl font-semibold tabular-nums text-ember-deep">
          {fcfa(amountDue(target, billing))} <span className="text-lg">FCFA</span>
        </p>
        <p className="text-sm text-muted-foreground">
          par {billing === 'annuel' ? 'an' : 'mois'}
          {billing === 'annuel' && ` · soit ${fcfa(monthlyPrice(target, 'annuel'))} FCFA/mois`}
        </p>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Paiement via {account.paymentMethod}. Le nouveau tarif s’applique dès aujourd’hui ; prochain paiement le {day(nextDate)}.
      </p>
      {PAYMENTS_SIMULATED && <p className="mt-3 rounded-xl bg-gold/15 p-3 text-xs leading-relaxed text-[#6b4510]">Paiement simulé : aucun prélèvement réel n’est effectué pour le moment.</p>}
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-2">
        <button type="button" onClick={confirm} disabled={busy} className={cn('inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-b from-ember to-ember-deep text-base font-semibold text-primary-foreground shadow-lg shadow-ember-deep/25 disabled:opacity-70', focusRing)}>
          {busy ? 'Enregistrement…' : `Confirmer le passage à ${target.name}`}
        </button>
        <button type="button" onClick={onClose} className={cn('h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground', focusRing)}>
          Annuler
        </button>
      </div>
    </Modal>
  )
}

function PaymentDialog({ account, onClose, onDone }: { account: Account; onClose: () => void; onDone: (message: string) => void }) {
  const labels = Object.values(paymentMethodLabels)
  const [method, setMethod] = useState(account.paymentMethod)
  const [error, setError] = useState('')

  function save() {
    if (!updateAccount({ paymentMethod: method })) return setError('Enregistrement impossible : le stockage du navigateur est plein.')
    onDone('Moyen de paiement mis à jour.')
  }

  return (
    <Modal title="Gérer le paiement" onClose={onClose}>
      <p className="mt-3 text-sm text-muted-foreground">Choisissez le moyen utilisé pour vos prochains paiements.</p>
      <div role="radiogroup" aria-label="Moyen de paiement" className="mt-4 grid gap-2">
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={method === label}
            onClick={() => setMethod(label)}
            className={cn('flex min-h-12 items-center gap-3 rounded-xl border px-4 text-left text-sm font-medium transition-colors', method === label ? 'border-ember bg-ember/5' : 'border-border bg-card hover:border-ember/50', focusRing)}
          >
            <span className={cn('inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2', method === label ? 'border-ember' : 'border-border')}>
              {method === label && <span className="size-2.5 rounded-full bg-ember" />}
            </span>
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <div className="mt-5 grid gap-2">
        <button type="button" onClick={save} className={cn('inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-b from-ember to-ember-deep text-base font-semibold text-primary-foreground shadow-lg shadow-ember-deep/25', focusRing)}>
          Enregistrer
        </button>
        <button type="button" onClick={onClose} className={cn('h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground', focusRing)}>
          Annuler
        </button>
      </div>
    </Modal>
  )
}
