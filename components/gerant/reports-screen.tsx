'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  Flame,
  Info,
  ChartPie,
  Armchair,
  ShoppingBag,
  Star,
  Upload,
  UtensilsCrossed,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa, type ManagerView } from '@/lib/gerant-data'
import { ordersActions, type StoreOrder } from '@/lib/orders-store'
import { buildReport, change, isCurrentPeriod, periodLabels, pointsDiff, shiftAnchor, type Period } from '@/lib/reports'
import { saveSettings, type Settings } from '@/lib/settings-store'
import { MobileTopBar } from './mobile-top-bar'
import { Panel } from './shared'

const periods = Object.keys(periodLabels) as Period[]

const num = (n: number) => n.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')
const dec1 = (n: number) => n.toFixed(1).replace('.', ',')

/** 1 480 000 -> « 1,48M » ; 820 000 -> « 820K ». */
function compact(v: number) {
  if (v >= 1_000_000) return `${String(Math.round((v / 1_000_000) * 100) / 100).replace('.', ',')}M`
  if (v >= 1000) return `${Math.round(v / 1000)}K`
  return String(v)
}

/** Graduations « rondes » de l'axe vertical : 0, 500K, 1M, 1,5M… */
function niceTicks(max: number) {
  const raw = Math.max(max, 1) / 3
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const top = Math.ceil(max / step) * step || step
  const ticks: number[] = []
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(Math.round(t))
  return { ticks, top: ticks[ticks.length - 1] }
}

function Badge({ value, suffix = '%', good = 'up' }: { value: number | null; suffix?: string; good?: 'up' | 'down' }) {
  if (value === null || value === 0) return null
  const positive = good === 'up' ? value > 0 : value < 0
  const Icon = value > 0 ? ArrowUp : ArrowDown
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', positive ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive')}>
      <Icon className="size-3" strokeWidth={2.5} aria-hidden="true" />
      <span>
        {value > 0 ? '+' : ''}
        {String(value).replace('.', ',')}
        {suffix}
      </span>
      <span className="sr-only">{positive ? ', en amélioration' : ', en baisse'}</span>
    </span>
  )
}

function Waves() {
  return (
    <svg viewBox="0 0 220 90" className="pointer-events-none absolute -bottom-3 right-0 h-24 w-56 text-ember/30" fill="none" stroke="currentColor" strokeWidth="0.7" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <path key={i} d={`M0 ${74 - i * 2.4} C 40 ${62 - i * 3}, 70 ${90 - i * 4.2}, 112 ${66 - i * 3} S 184 ${42 - i * 2.4}, 220 ${30 - i * 3}`} />
      ))}
    </svg>
  )
}

function BarChart({ series, title }: { series: { label: string; full: string; value: number }[]; title: string }) {
  const max = Math.max(...series.map((s) => s.value), 0)
  const { ticks, top } = niceTicks(max)
  const dense = series.length > 12
  const every = series.length > 20 ? 5 : 1
  const labelClass = series.length <= 7 ? '' : series.length <= 12 ? 'hidden sm:block' : 'hidden'
  return (
    <div className="flex gap-2">
      <div className="relative h-44 w-9 shrink-0 text-[11px] text-muted-foreground" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
            {t === 0 ? '0' : compact(t)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="relative h-44"
          role="img"
          aria-label={`${title} : ${series.filter((s) => s.value > 0).map((s) => `${s.full} ${fcfa(s.value)}`).join(', ') || 'aucune vente'}`}
        >
          {ticks.map((t) => (
            <span key={t} className="absolute inset-x-0 border-t border-border/80" style={{ bottom: `${(t / top) * 100}%` }} aria-hidden="true" />
          ))}
          <div className={cn('absolute inset-0 flex items-end', dense ? 'gap-0.5 sm:gap-1.5' : 'gap-2 sm:gap-4')}>
            {series.map((s) => {
              const h = (s.value / top) * 100
              return (
                <div key={s.full} className="relative h-full min-w-0 flex-1" title={`${s.full} : ${fcfa(s.value)}`}>
                  {s.value > 0 && (
                    <span className={cn('absolute inset-x-0 text-center text-[11px] font-medium tabular-nums text-foreground', labelClass)} style={{ bottom: `calc(${h}% + 4px)` }}>
                      {compact(s.value)}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 rounded-t-md bg-ember-deep" style={{ height: `${h}%` }} />
                </div>
              )
            })}
          </div>
        </div>
        <div className={cn('mt-2 flex', dense ? 'gap-0.5 sm:gap-1.5' : 'gap-2 sm:gap-4')} aria-hidden="true">
          {series.map((s, i) => (
            <span key={s.full} className={cn('min-w-0 flex-1 truncate text-center text-muted-foreground', dense ? 'text-[10px]' : 'text-xs')}>
              {i % every === 0 ? s.label : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stars({ average }: { average: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('size-3.5', i < Math.round(average) ? 'fill-gold text-gold' : 'text-border')} />
      ))}
    </span>
  )
}

function Indicator({ icon: Icon, label, value, badge, help }: { icon: typeof Clock; label: string; value: string; badge: React.ReactNode; help: string }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-xl border border-border bg-card shadow-[0_8px_24px_-18px_rgba(74,36,14,0.35)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
      >
        <Icon className="size-5 shrink-0 text-ember-deep" strokeWidth={1.7} aria-hidden="true" />
        <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
        <span className="flex w-16 justify-end">{badge}</span>
        <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')} aria-hidden="true" />
      </button>
      {open && <p className="border-t border-border px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">{help}</p>}
    </li>
  )
}

export function ReportsScreen({
  orders,
  settings,
  tableCount,
  pending,
  onNavigate,
}: {
  orders: StoreOrder[]
  settings: Settings
  tableCount: number
  pending: number
  onNavigate: (view: ManagerView) => void
}) {
  const [period, setPeriod] = useState<Period>('semaine')
  const [anchor, setAnchor] = useState(() => new Date())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [more, setMore] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)

  const report = useMemo(() => buildReport(orders, settings.demoData, period, anchor, tableCount), [orders, settings.demoData, period, anchor, tableCount])
  const current = isCurrentPeriod(period, anchor)
  const prev = report.previous
  const maxDish = Math.max(...report.topDishes.map((d) => d.revenue), 1)

  useEffect(() => {
    if (!pickerOpen) return
    const onDown = (e: MouseEvent) => !pickerRef.current?.contains(e.target as Node) && setPickerOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPickerOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen])

  async function exportPdf() {
    setExporting(true)
    setExportError('')
    try {
      const { exportReportPdf } = await import('@/lib/report-pdf')
      await exportReportPdf(report, settings.restaurantName, settings.demoData)
    } catch {
      setExportError('Impossible de générer le PDF. Réessayez.')
    } finally {
      setExporting(false)
    }
  }

  function hideDemo() {
    ordersActions.clearDemo()
    saveSettings({ ...settings, demoData: false })
  }

  const cardClass = 'rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]'

  return (
    <>
      <MobileTopBar pending={pending} onNavigate={onNavigate} withMenu />

      {/* Titre + période */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-5xl font-semibold leading-none text-foreground">Rapports</h1>
          <div className="mt-3 flex items-center gap-1 text-ember-deep">
            <button type="button" onClick={() => setAnchor((a) => shiftAnchor(period, a, -1))} aria-label="Période précédente" className="inline-flex size-8 items-center justify-center rounded-full hover:bg-ember/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <p className="text-sm font-medium sm:text-base" aria-live="polite">
              {report.shortTitle}
            </p>
            <button type="button" onClick={() => setAnchor((a) => shiftAnchor(period, a, 1))} disabled={current} aria-label="Période suivante" className="inline-flex size-8 items-center justify-center rounded-full hover:bg-ember/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 disabled:opacity-35">
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            {!current && (
              <button type="button" onClick={() => setAnchor(new Date())} className="ml-1 rounded-full px-2 py-1 text-xs font-semibold underline underline-offset-4 hover:bg-ember/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                Aujourd’hui
              </button>
            )}
          </div>
        </div>

        <div ref={pickerRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={pickerOpen}
            aria-label={`Choisir la période : ${periodLabels[period]}`}
            className="inline-flex size-12 items-center justify-center rounded-xl border border-gold/60 bg-card text-ember-deep shadow-sm hover:border-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
          >
            <CalendarDays className="size-6" strokeWidth={1.6} aria-hidden="true" />
          </button>
          {pickerOpen && (
            <div role="radiogroup" aria-label="Type de période" className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl">
              {periods.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={period === p}
                  onClick={() => {
                    setPeriod(p)
                    setAnchor(new Date())
                    setPickerOpen(false)
                  }}
                  className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-ember/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30', period === p && 'text-ember')}
                >
                  {periodLabels[p]}
                  {period === p && <Check className="size-4" aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {settings.demoData && (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-gold/15 p-3 text-sm text-[#6b4510]">
          <Info className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">Historique fictif de démonstration inclus.</span>
          <button type="button" onClick={hideDemo} className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
            Supprimer
          </button>
        </p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* Colonne principale */}
        <div className="flex flex-col gap-4">
          <section aria-labelledby="ca-title" className={cn(cardClass, 'relative overflow-hidden p-5')}>
            <div className="flex items-start justify-between gap-3">
              <h2 id="ca-title" className="text-base font-medium">
                Chiffre d’affaires
              </h2>
              <Badge value={change(report.revenue, prev?.revenue)} />
            </div>
            <p className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="font-serif text-5xl font-semibold tabular-nums leading-none">{num(report.revenue)}</span>
              <span className="text-lg font-medium text-ember-deep">FCFA</span>
            </p>
            <div className="h-6" />
            <Waves />
          </section>

          <div className="grid grid-cols-3 gap-3">
            <section aria-labelledby="k-cmd" className={cn(cardClass, 'p-3')}>
              <div className="flex items-start gap-1.5">
                <FileText className="size-6 shrink-0 text-ember-deep" strokeWidth={1.6} aria-hidden="true" />
                <h2 id="k-cmd" className="pt-0.5 text-[11px] font-medium leading-tight sm:text-xs">
                  Commandes
                </h2>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="font-serif text-2xl font-semibold tabular-nums">{report.count}</span>
                <Badge value={change(report.count, prev?.count)} />
              </p>
            </section>

            <section aria-labelledby="k-avg" className={cn(cardClass, 'p-3')}>
              <div className="flex items-start gap-1.5">
                <ShoppingBag className="size-6 shrink-0 text-ember-deep" strokeWidth={1.6} aria-hidden="true" />
                <h2 id="k-avg" className="pt-0.5 text-[11px] font-medium leading-tight sm:text-xs">
                  Panier moyen
                </h2>
              </div>
              <p className="mt-2 font-serif text-xl font-semibold tabular-nums leading-tight sm:text-2xl">
                {num(report.average)} <span className="font-sans text-[11px] font-medium text-foreground/80">FCFA</span>
              </p>
            </section>

            <section aria-labelledby="k-sat" className={cn(cardClass, 'p-3')}>
              <div className="flex items-start gap-1.5">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-ember-deep text-white">
                  <Star className="size-3.5 fill-white" aria-hidden="true" />
                </span>
                <h2 id="k-sat" className="pt-0.5 text-[11px] font-medium leading-tight sm:text-xs">
                  Taux de satisfaction
                </h2>
              </div>
              {report.satisfaction ? (
                <>
                  <p className="mt-2 text-center font-serif text-2xl font-semibold tabular-nums">
                    {dec1(report.satisfaction.average)}
                    <span className="font-sans text-xs font-normal text-muted-foreground">/5</span>
                  </p>
                  <p className="mt-0.5 flex justify-center">
                    <Stars average={report.satisfaction.average} />
                  </p>
                  <span className="sr-only">{report.satisfaction.count} avis</span>
                </>
              ) : (
                <p className="mt-2 text-center text-xs text-muted-foreground">Aucun avis</p>
              )}
            </section>
          </div>

          <section aria-labelledby="chart-title" className={cn(cardClass, 'p-4 sm:p-5')}>
            <div className="mb-4 flex items-center justify-between">
              <h2 id="chart-title" className="font-serif text-xl font-semibold">
                {report.seriesTitle}
              </h2>
              <CalendarDays className="size-5 text-ember-deep" strokeWidth={1.6} aria-hidden="true" />
            </div>
            {report.count === 0 ? <p className="py-14 text-center text-sm text-muted-foreground">Aucune vente encaissée sur cette période.</p> : <BarChart series={report.series} title={report.seriesTitle} />}
          </section>
        </div>

        {/* Colonne secondaire */}
        <div className="flex flex-col gap-5">
          <section aria-labelledby="top-title">
            <h2 id="top-title" className="mb-2.5 font-serif text-xl font-semibold">
              Top performances
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className={cn(cardClass, 'p-3.5')}>
                <div className="flex items-center gap-2">
                  <Flame className="size-6 shrink-0 text-ember" strokeWidth={1.6} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Top plat</p>
                    <p className="truncate text-sm font-semibold">{report.topDish ? report.topDish.name : '—'}</p>
                  </div>
                </div>
                <div className="my-2.5 h-px bg-ember/30" />
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="size-6 shrink-0 text-ember-deep" strokeWidth={1.6} aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ventes</p>
                    <p className="text-lg font-semibold tabular-nums leading-tight">{report.topDish ? num(report.topDish.qty) : '—'}</p>
                  </div>
                </div>
              </div>

              <div className={cn(cardClass, 'p-3.5')}>
                <div className="flex items-center gap-2">
                  <Crown className="size-6 shrink-0 text-gold" strokeWidth={1.6} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Meilleure table</p>
                    <p className="truncate text-sm font-semibold">{report.bestTable ? `Table ${report.bestTable.table}` : '—'}</p>
                  </div>
                </div>
                <div className="my-2.5 h-px bg-gold/40" />
                <div className="flex items-center gap-2">
                  <Users className="size-6 shrink-0 text-gold" strokeWidth={1.6} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">CA généré</p>
                    <p className="truncate text-sm font-semibold tabular-nums leading-tight">{report.bestTable ? fcfa(report.bestTable.revenue) : '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="ind-title">
            <h2 id="ind-title" className="mb-2.5 font-serif text-xl font-semibold">
              Indicateurs clés
            </h2>
            <ul className="flex flex-col gap-2">
              <Indicator
                icon={Armchair}
                label="Taux d’occupation"
                value={report.occupancy === null ? '—' : `${report.occupancy}%`}
                badge={<Badge value={pointsDiff(report.occupancy, prev?.occupancy)} />}
                help="Part moyenne des tables servies au moins une fois par jour sur la période. La variation est l’écart, en points, avec la période précédente."
              />
              <Indicator
                icon={Clock}
                label="Temps moyen de service"
                value={report.serviceMin === null ? '—' : `${report.serviceMin} min`}
                badge={<Badge value={prev?.serviceMin ? change(report.serviceMin ?? 0, prev.serviceMin) : null} good="down" />}
                help="Temps moyen entre la prise de commande et le service à table, mesuré par la cuisine. Plus il baisse, mieux c’est."
              />
              <Indicator
                icon={ChartPie}
                label="Taux d’annulation"
                value={report.cancelRate === null ? '—' : `${dec1(report.cancelRate)}%`}
                badge={<Badge value={pointsDiff(report.cancelRate, prev?.cancelRate, 1)} good="down" />}
                help="Part des commandes annulées parmi toutes les commandes de la période. La variation est l’écart, en points, avec la période précédente."
              />
            </ul>
          </section>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={exportPdf}
              disabled={exporting}
              className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-ember-deep text-base font-semibold text-primary-foreground shadow-lg shadow-ember-deep/30 transition-colors hover:bg-ember-deep/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40 disabled:opacity-70"
            >
              <Upload className="size-5" aria-hidden="true" />
              {exporting ? 'Création du PDF…' : 'Exporter le rapport'}
            </button>
            {exportError && (
              <p role="alert" className="text-sm text-destructive">
                {exportError}
              </p>
            )}
            <button
              type="button"
              onClick={() => setMore((m) => !m)}
              aria-expanded={more}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gold/60 bg-card text-sm font-semibold text-ember-deep transition-colors hover:border-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
            >
              {more ? 'Masquer les analyses' : 'Voir plus d’analyses'}
              <ChevronRight className={cn('size-4 transition-transform', more && '-rotate-90')} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {more && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Panel>
            <h2 className="mb-1 font-serif text-xl font-semibold">Classement des plats</h2>
            <p className="mb-3 text-xs text-muted-foreground">Heure de pointe : {report.peak ? `${report.peak.label} (${fcfa(report.peak.value)})` : '—'} · {report.itemsSold} plats vendus</p>
            {report.topDishes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune vente.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {report.topDishes.map((d, i) => (
                  <li key={d.name}>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-ember/12 text-xs font-semibold text-ember">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{d.name}</span>
                      <span className="text-muted-foreground">{d.qty}×</span>
                      <span className="w-28 text-right font-semibold tabular-nums">{fcfa(d.revenue)}</span>
                    </div>
                    <div className="ml-10 mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <div className="h-full rounded-full bg-ember" style={{ width: `${(d.revenue / maxDish) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel>
            <h2 className="mb-3 font-serif text-xl font-semibold">Modes de paiement</h2>
            <ul className="flex flex-col gap-4">
              {report.byMethod.map((m) => {
                const share = report.revenue ? Math.round((m.total / report.revenue) * 100) : 0
                return (
                  <li key={m.method}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground">
                        {m.count} paiements · {share} %
                      </span>
                      <span className="font-semibold tabular-nums">{fcfa(m.total)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <div className="h-full rounded-full bg-success" style={{ width: `${share}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </div>
      )}
    </>
  )
}
