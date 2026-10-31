'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, ChevronRight, CreditCard, EllipsisVertical, Eye, Headset, Pencil, TrendingUp, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa } from '@/lib/gerant-data'
import { demoKpis, demoRestaurants, demoSignups12, periodOptions } from '@/lib/superadmin-demo'
import { DEMO_SUPERADMIN } from '@/lib/superadmin-auth'
import { loadAdminData, signupSeriesFrom, type AdminData, type Overview, type RestaurantRow, type RestaurantStatus } from '@/lib/superadmin-data'
import { friendlyError } from '@/lib/supabase/runtime'

const card = 'rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]'
const num = (n: number) => n.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')

function Kpi({ icon: Icon, label, children, spark }: { icon: LucideIcon; label: string; children: React.ReactNode; spark?: boolean }) {
  return (
    <div className={cn(card, 'flex items-center gap-3.5 p-4')}>
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[#f6e6d3] text-[#b8741a]">
        <Icon className="size-6" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-foreground/80">{label}</p>
        <p className="font-serif text-3xl font-semibold leading-tight tabular-nums">{children}</p>
      </div>
      {spark && (
        <svg viewBox="0 0 48 24" className="ml-auto hidden h-6 w-12 shrink-0 text-ember/40 2xl:block" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 20 12 12l8 5 12-11 14 3M40 4h6v6" />
        </svg>
      )}
    </div>
  )
}

function PlanPill({ plan }: { plan: string }) {
  return <span className={cn('inline-flex rounded-md px-2.5 py-1 text-xs font-medium', plan === 'Premium' ? 'bg-[#fbe3cf] text-[#b8541f]' : 'bg-[#efe6dc] text-foreground/75')}>{plan}</span>
}

function StatusPill({ status }: { status: RestaurantStatus }) {
  return <span className={cn('inline-flex rounded-md px-2.5 py-1 text-xs font-semibold', status === 'Actif' ? 'bg-success/15 text-success' : 'bg-destructive text-white')}>{status}</span>
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
}

function SignupsChart({ series }: { series: { label: string; value: number }[] }) {
  const W = 380
  const H = 210
  const left = 34
  const right = 14
  const top = 22
  const bottom = 34
  const max = Math.max(...series.map((s) => s.value), 1)
  const step = max <= 6 ? 1 : max <= 12 ? 2 : max <= 30 ? 5 : 20
  const ymax = Math.max(Math.ceil(max / step) * step, step * 3)
  const ticks = Array.from({ length: ymax / step + 1 }, (_, i) => i * step)
  const x = (i: number) => left + (series.length === 1 ? 0 : (i / (series.length - 1)) * (W - left - right))
  const y = (v: number) => top + (1 - v / ymax) * (H - top - bottom)
  const pts = series.map((s, i) => [x(i), y(s.value)] as const)
  const line = pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - bottom} L${pts[0][0].toFixed(1)},${H - bottom} Z`
  const [lx, ly] = pts[pts.length - 1]
  const lastValue = series[series.length - 1].value
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Inscriptions par mois : ${series.map((s) => `${s.label} ${s.value}`).join(', ')}`}>
      <defs>
        <linearGradient id="sa-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--ember)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
          <text x={left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
            {t}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#sa-area)" />
      <path d={line} fill="none" stroke="var(--ember)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={i === pts.length - 1 ? 5 : 4} fill="var(--ember)" stroke="var(--card)" strokeWidth="1.5" />
      ))}
      {series.map((s, i) => (
        <text key={s.label + i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
          {s.label}
        </text>
      ))}
      <g transform={`translate(${lx - 17},${ly - 30})`}>
        <rect width="34" height="22" rx="6" fill="var(--ember-deep)" />
        <text x="17" y="15" textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff">
          {lastValue}
        </text>
      </g>
    </svg>
  )
}

function Detail({ restaurant, onClose }: { restaurant: RestaurantRow; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  const rows: [string, React.ReactNode][] = [
    ['Adresse', restaurant.address],
    ['Gérant', restaurant.owner],
    ['Formule', <PlanPill key="p" plan={restaurant.plan} />],
    ['Facturation', restaurant.billing],
    ['Statut', <StatusPill key="s" status={restaurant.status} />],
    ['Inscrit le', fmtDate(restaurant.createdAt)],
    ['Tables', String(restaurant.tables)],
    ...(restaurant.monthlyRevenue !== undefined ? ([['Ventes du mois', fcfa(restaurant.monthlyRevenue)]] as [string, React.ReactNode][]) : []),
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={`Fiche de ${restaurant.name}`}>
      <div className="w-full max-w-md rounded-t-3xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:rounded-3xl md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold">{restaurant.name}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="inline-flex size-9 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <dl className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {DEMO_SUPERADMIN && <p className="mt-4 text-xs text-muted-foreground">Données fictives (maquette).</p>}
      </div>
    </div>
  )
}

const emptyOverview: Overview = { restaurants: 0, activeSubscriptions: 0, newThisMonth: 0, openTickets: 0, monthlyRevenue: 0, signups12: Array(12).fill(0) }

/** Mode démonstration : les données fictives, mises au même format que les données réelles. */
function demoData(): AdminData {
  return {
    overview: { ...demoKpis, signups12: demoSignups12 },
    recent: demoRestaurants.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.city,
      plan: r.plan,
      status: r.status,
      billing: 'Mensuel' as const,
      createdAt: new Date(Date.now() - r.daysAgo * 86_400_000).toISOString(),
      owner: r.owner,
      tables: r.tables,
      monthlyRevenue: r.monthlyRevenue,
    })),
  }
}

export function SuperAdminDashboard() {
  const [months, setMonths] = useState<number>(7)
  const [detail, setDetail] = useState<RestaurantRow | null>(null)
  const [notice, setNotice] = useState('')
  const [data, setData] = useState<AdminData | null>(() => (DEMO_SUPERADMIN ? demoData() : null))
  const [error, setError] = useState('')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (DEMO_SUPERADMIN) return
    let off = false
    loadAdminData()
      .then((d) => !off && setData(d))
      .catch((e: unknown) => !off && setError(friendlyError(e instanceof Error ? e.message : String(e))))
    return () => {
      off = true
    }
  }, [])

  const kpis = data?.overview ?? emptyOverview
  const restaurants = data?.recent ?? []
  const series = useMemo(() => signupSeriesFrom(kpis.signups12, months), [kpis.signups12, months])

  function soon(what: string) {
    setNotice(`${what} sera disponible avec la base de données (maquette).`)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setNotice(''), 3500)
  }

  const quick: { label: string; href: string; icon: LucideIcon; extra?: string }[] = [
    { label: 'Voir tous les restaurants', href: '/superadmin/restaurants', icon: Building2 },
    { label: 'Gérer les abonnements', href: '/superadmin/abonnements', icon: CreditCard },
    { label: 'Tickets support ouverts', href: '/superadmin/support', icon: Headset, extra: `(${kpis.openTickets})` },
  ]

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Building2} label="Total Restaurants">
          {num(kpis.restaurants)}
        </Kpi>
        <Kpi icon={CreditCard} label="Abonnements Actifs">
          {num(kpis.activeSubscriptions)}
        </Kpi>
        <Kpi icon={TrendingUp} label="Revenu Mensuel">
          <span className="whitespace-nowrap text-xl"><span>{num(kpis.monthlyRevenue)}</span> <span className="font-sans text-sm font-medium">FCFA</span></span>
        </Kpi>
        <Kpi icon={Users} label="Nouveaux ce mois" spark>
          +{kpis.newThisMonth}
        </Kpi>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          Impossible de charger les données : {error}
        </p>
      )}
      {!data && !error && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Chargement des données…
        </p>
      )}

      {notice && (
        <p role="status" className="mt-4 rounded-xl bg-gold/15 p-3 text-sm text-[#6b4510]">
          {notice}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* Restaurants récents */}
        <section aria-labelledby="recent-title" className={cn(card, 'overflow-hidden')}>
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 id="recent-title" className="font-serif text-xl font-semibold">
              Restaurants récents
            </h2>
            <Link href="/superadmin/restaurants" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ember-deep hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
              Voir tous <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {data && restaurants.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted-foreground">Aucun restaurant pour le moment.</p>}

          {/* Tableau (tablette et ordinateur) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-xs text-foreground/80">
                  {['Nom du restaurant', 'Adresse', 'Plan', 'Statut', 'Date d’inscription', 'Actions'].map((h) => (
                    <th key={h} scope="col" className="px-3 py-3 font-medium first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border border-t border-border">
                {restaurants.map((r) => (
                  <tr key={r.id}>
                    <th scope="row" className="py-4 pl-5 pr-3 font-medium">
                      {r.name}
                    </th>
                    <td className="whitespace-nowrap px-3 py-4">{r.address}</td>
                    <td className="px-3 py-4">
                      <PlanPill plan={r.plan} />
                    </td>
                    <td className="px-3 py-4">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">{fmtDate(r.createdAt)}</td>
                    <td className="py-4 pl-3 pr-5">
                      <span className="flex items-center gap-2 text-foreground/85">
                        <button type="button" onClick={() => setDetail(r)} aria-label={`Voir ${r.name}`} className="rounded p-1 hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                          <Eye className="size-4.5" aria-hidden="true" />
                        </button>
                        {DEMO_SUPERADMIN && (
                          <>
                        <button type="button" onClick={() => soon('La modification')} aria-label={`Modifier ${r.name}`} className="rounded p-1 hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                          <Pencil className="size-4.5" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => soon('Le menu d’actions')} aria-label={`Plus d’actions pour ${r.name}`} className="rounded p-1 hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                          <EllipsisVertical className="size-4.5" aria-hidden="true" />
                        </button>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Liste (téléphone) */}
          <ul className="divide-y divide-border md:hidden">
            {restaurants.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => setDetail(r)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ember/30">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {r.address} · {fmtDate(r.createdAt)}
                    </span>
                    <span className="mt-1.5 flex gap-2">
                      <PlanPill plan={r.plan} />
                      <StatusPill status={r.status} />
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Colonne de droite */}
        <div className="flex flex-col gap-5">
          <section aria-labelledby="signups-title" className={cn(card, 'p-5')}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="signups-title" className="font-serif text-xl font-semibold">
                Évolution des inscriptions
              </h2>
              <label className="sr-only" htmlFor="signups-period">
                Période
              </label>
              <select id="signups-period" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ember focus:ring-3 focus:ring-ember/20">
                {periodOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <SignupsChart series={series} />
          </section>

          <section aria-labelledby="quick-title" className={cn(card, 'p-5')}>
            <h2 id="quick-title" className="mb-3 font-serif text-xl font-semibold">
              Actions rapides
            </h2>
            <ul className="flex flex-col gap-2.5">
              {quick.map(({ label, href, icon: Icon, extra }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm font-medium transition-colors hover:border-ember/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                    <Icon className="size-5 shrink-0 text-[#b8741a]" strokeWidth={1.7} aria-hidden="true" />
                    <span className="flex-1">
                      {label} {extra && <span className="text-ember-deep">{extra}</span>}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {detail && <Detail restaurant={detail} onClose={() => setDetail(null)} />}
    </>
  )
}
