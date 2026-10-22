'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, FileDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa } from '@/lib/gerant-data'
import type { StoreOrder } from '@/lib/orders-store'
import { buildReport, change, isCurrentPeriod, periodLabels, shiftAnchor, type Period } from '@/lib/reports'
import { saveSettings, type Settings } from '@/lib/settings-store'
import { ordersActions } from '@/lib/orders-store'
import { Panel, ScreenHeader } from './shared'

const periods = Object.keys(periodLabels) as Period[]

function Delta({ value, partial }: { value: number | null; partial: boolean }) {
  if (value === null) return <p className="mt-2 text-xs text-muted-foreground">Pas de comparaison possible</p>
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 font-semibold', value >= 0 ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive')}>
        {value > 0 ? '+' : ''}
        {value} %
      </span>
      {partial ? 'vs même durée, période préc.' : 'vs période précédente'}
    </p>
  )
}

function BarChart({ series, title }: { series: { label: string; value: number }[]; title: string }) {
  const max = Math.max(...series.map((s) => s.value), 1)
  const dense = series.length > 16
  const every = series.length > 20 ? 5 : 1
  return (
    <div>
      <div className="flex h-52 items-end gap-0.5 sm:gap-1.5" role="img" aria-label={`${title} : ${series.filter((s) => s.value > 0).map((s) => `${s.label} ${fcfa(s.value)}`).join(', ') || 'aucune vente'}`}>
        {series.map((s) => (
          <div key={s.label} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end" title={`${s.label} : ${fcfa(s.value)}`}>
            <div
              className="w-full rounded-t-sm bg-[linear-gradient(180deg,var(--ember)_0%,var(--ember-deep)_100%)] transition-opacity group-hover:opacity-80"
              style={{ height: s.value > 0 ? `${Math.max(2, (s.value / max) * 100)}%` : '0%' }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-0.5 sm:gap-1.5" aria-hidden="true">
        {series.map((s, i) => (
          <span key={s.label} className={cn('min-w-0 flex-1 truncate text-center text-muted-foreground', dense ? 'text-[10px]' : 'text-xs')}>
            {i % every === 0 ? s.label : ''}
          </span>
        ))}
      </div>
      <p className="mt-1 text-right text-xs text-muted-foreground">Maximum : {fcfa(max)}</p>
    </div>
  )
}

export function ReportsScreen({ orders, settings }: { orders: StoreOrder[]; settings: Settings }) {
  const [period, setPeriod] = useState<Period>('semaine')
  const [anchor, setAnchor] = useState(() => new Date())
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const report = useMemo(() => buildReport(orders, settings.demoData, period, anchor), [orders, settings.demoData, period, anchor])
  const current = isCurrentPeriod(period, anchor)
  const maxDish = Math.max(...report.topDishes.map((d) => d.revenue), 1)

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

  const kpis = [
    { label: 'Chiffre d’affaires', value: fcfa(report.revenue), delta: change(report.revenue, report.previous?.revenue) },
    { label: 'Commandes encaissées', value: String(report.count), delta: change(report.count, report.previous?.count) },
    { label: 'Panier moyen', value: fcfa(report.average), delta: change(report.average, report.previous?.average) },
  ]

  return (
    <>
      <ScreenHeader
        title="Rapports"
        subtitle="Calculés à partir des commandes encaissées en caisse."
        actions={
          <button
            type="button"
            onClick={exportPdf}
            disabled={exporting}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ember px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-ember/25 hover:bg-ember-deep focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/35 disabled:opacity-60"
          >
            <FileDown className="size-4" aria-hidden="true" />
            {exporting ? 'Création…' : 'Exporter en PDF'}
          </button>
        }
      />
      {exportError && <p role="alert" className="-mt-3 mb-3 text-sm text-destructive">{exportError}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Période du rapport" className="inline-flex rounded-full border border-border bg-card p-1">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={period === p}
              onClick={() => {
                setPeriod(p)
                setAnchor(new Date())
              }}
              className={cn('h-9 flex-1 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 sm:flex-none', period === p ? 'bg-ember text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button type="button" onClick={() => setAnchor((a) => shiftAnchor(period, a, -1))} aria-label="Période précédente" className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <p className="min-w-0 flex-1 text-center text-sm font-semibold sm:min-w-56 sm:flex-none" aria-live="polite">{report.title}</p>
          <button type="button" onClick={() => setAnchor((a) => shiftAnchor(period, a, 1))} disabled={current} aria-label="Période suivante" className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 disabled:opacity-40">
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          {!current && (
            <button type="button" onClick={() => setAnchor(new Date())} className="h-10 rounded-full px-3 text-sm font-semibold text-ember hover:bg-ember/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
              Aujourd’hui
            </button>
          )}
        </div>
      </div>

      {settings.demoData && (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-gold/15 p-3 text-sm text-[#6b4510]">
          <Info className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">Ces rapports incluent un historique fictif de démonstration.</span>
          <button type="button" onClick={hideDemo} className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
            Supprimer les données de démonstration
          </button>
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <Panel key={k.label}>
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-serif text-3xl font-semibold tabular-nums">{k.value}</p>
            <Delta value={k.delta} partial={report.partial} />
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Panel className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Plats vendus</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{report.itemsSold}</p>
        </Panel>
        <Panel className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Heure de pointe</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{report.peak ? report.peak.label : '—'}</p>
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="mb-4 font-serif text-xl font-semibold">{report.seriesTitle}</h2>
        {report.count === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Aucune vente encaissée sur cette période.</p> : <BarChart series={report.series} title={report.seriesTitle} />}
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 font-serif text-xl font-semibold">Classement des plats</h2>
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
                    <span className="text-muted-foreground">{m.count} paiements · {share} %</span>
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
    </>
  )
}
