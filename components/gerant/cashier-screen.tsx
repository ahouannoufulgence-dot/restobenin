'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Banknote, Check, CreditCard, Plus, Printer, ReceiptText, Smartphone, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa } from '@/lib/gerant-data'
import { isUnpaid, ordersActions, payMethodLabels, tableLabel, type PayMethod, type StoreOrder } from '@/lib/orders-store'
import type { MenuDish } from '@/lib/menu-store'
import { receiptHtml } from '@/lib/receipt'
import type { Settings } from '@/lib/settings-store'
import { QtyStepper } from '@/components/client/ui'
import { Panel, ScreenHeader, StatusBadge, primaryAction } from './shared'

const methods: { id: PayMethod; icon: typeof Banknote }[] = [
  { id: 'especes', icon: Banknote },
  { id: 'mobile_money', icon: Smartphone },
  { id: 'carte', icon: CreditCard },
]

const time = (ms: number) => new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
const isToday = (ms: number) => new Date(ms).toDateString() === new Date().toDateString()

function quickAmounts(total: number) {
  const up = (step: number) => Math.ceil(total / step) * step
  return [...new Set([total, up(1000), up(5000), up(10000)])].filter((v) => v >= total).slice(0, 4)
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:rounded-3xl md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="inline-flex size-9 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ReceiptDialog({ order, settings, onClose }: { order: StoreOrder; settings: Settings; onClose: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const html = useMemo(
    () => receiptHtml({ name: settings.restaurantName, address: settings.address, phone: settings.phone, footer: settings.receiptFooter }, order),
    [order, settings],
  )
  const change = order.payment?.change ?? 0
  return (
    <Dialog title="Paiement enregistré" onClose={onClose}>
      <div className="flex items-center gap-3 rounded-xl bg-success/12 p-3 text-success">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-success text-white">
          <Check className="size-5" strokeWidth={3} aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold">
          {tableLabel(order.table)} · {fcfa(order.total)} · {order.payment && payMethodLabels[order.payment.method]}
        </p>
      </div>
      {order.payment?.method === 'especes' && (
        <p className="mt-4 text-center">
          <span className="block text-sm text-muted-foreground">Monnaie à rendre</span>
          <span className="font-serif text-4xl font-semibold tabular-nums text-ember-deep">{fcfa(change)}</span>
        </p>
      )}
      <iframe ref={frame} srcDoc={html} title={`Aperçu du reçu n° ${order.number}`} className="mt-4 h-96 w-full rounded-xl border border-border bg-white" />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => frame.current?.contentWindow?.print()} className={cn(primaryAction, 'h-12 flex-1')}>
          <Printer className="size-4" aria-hidden="true" />
          Imprimer le reçu
        </button>
        <button type="button" onClick={onClose} className="h-12 flex-1 rounded-xl border border-border text-sm font-semibold hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
          Terminer
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Format ticket 80 mm. Dans la fenêtre d’impression, choisissez votre imprimante de reçus (ou « Enregistrer en PDF »).</p>
    </Dialog>
  )
}

function SaleDialog({ dishes, onCreate, onClose }: { dishes: MenuDish[]; onCreate: (lines: { id: string; name: string; qty: number; price: number }[]) => void; onClose: () => void }) {
  const [qty, setQty] = useState<Record<string, number>>({})
  const available = dishes.filter((d) => d.available)
  const chosen = available.filter((d) => (qty[d.id] ?? 0) > 0)
  const total = chosen.reduce((s, d) => s + d.price * qty[d.id], 0)
  return (
    <Dialog title="Nouvelle vente au comptoir" onClose={onClose}>
      <ul className="divide-y divide-border">
        {available.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{d.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{fcfa(d.price)}</span>
            </span>
            <QtyStepper qty={qty[d.id] ?? 0} onChange={(n) => setQty((q) => ({ ...q, [d.id]: n }))} name={d.name} size="sm" />
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={chosen.length === 0}
        onClick={() => onCreate(chosen.map((d) => ({ id: d.id, name: d.name, qty: qty[d.id], price: d.price })))}
        className={cn(primaryAction, 'mt-5 w-full disabled:opacity-50')}
      >
        {chosen.length === 0 ? 'Choisissez au moins un plat' : `Envoyer en cuisine · ${fcfa(total)}`}
      </button>
      <p className="mt-2 text-xs text-muted-foreground">La commande part en cuisine et s’ouvre ensuite ici pour l’encaisser.</p>
    </Dialog>
  )
}

export function CashierScreen({ orders, dishes, settings }: { orders: StoreOrder[]; dishes: MenuDish[]; settings: Settings }) {
  const [tab, setTab] = useState<'due' | 'paid'>('due')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [method, setMethod] = useState<PayMethod>('especes')
  const [received, setReceived] = useState('')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<StoreOrder | null>(null)
  const [sale, setSale] = useState(false)

  const due = orders.filter(isUnpaid).sort((a, b) => a.createdAt - b.createdAt)
  const paidToday = orders.filter((o) => o.payment && isToday(o.payment.at)).sort((a, b) => b.payment!.at - a.payment!.at)
  const selected = due.find((o) => o.id === selectedId) ?? due[0]

  const totalToday = paidToday.reduce((s, o) => s + o.total, 0)
  const byMethod = (m: PayMethod) => paidToday.filter((o) => o.payment!.method === m).reduce((s, o) => s + o.total, 0)

  const receivedNumber = Number(received) || 0
  const canPay = !!selected && (method !== 'especes' || receivedNumber >= selected.total)

  function pay() {
    if (!selected) return
    const result = ordersActions.pay(selected.id, method, method === 'especes' ? receivedNumber : selected.total)
    if (!result) return setError('Paiement impossible. Vérifiez le montant reçu.')
    setError('')
    setReceived('')
    setSelectedId(null)
    setReceipt(result)
  }

  function select(id: string) {
    setSelectedId(id)
    setReceived('')
    setError('')
  }

  return (
    <>
      <ScreenHeader
        title="Caisse"
        subtitle="Encaissez les commandes et imprimez les reçus."
        actions={
          <button type="button" onClick={() => setSale(true)} className={cn(primaryAction, 'h-10 px-4')}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Vente au comptoir</span>
            <span className="sm:hidden">Vente</span>
          </button>
        }
      />

      <dl className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel className="p-3 sm:p-4">
          <dt className="text-xs text-muted-foreground">Encaissé aujourd’hui</dt>
          <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">{fcfa(totalToday)}</dd>
          <dd className="text-xs text-muted-foreground">{paidToday.length} ticket{paidToday.length > 1 ? 's' : ''}</dd>
        </Panel>
        {methods.map(({ id, icon: Icon }) => (
          <Panel key={id} className="p-3 sm:p-4">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="size-3.5" aria-hidden="true" />
              {payMethodLabels[id]}
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{fcfa(byMethod(id))}</dd>
          </Panel>
        ))}
      </dl>

      <div role="tablist" aria-label="Caisse" className="mb-4 flex gap-1 border-b border-border">
        {([
          ['due', `À encaisser (${due.length})`],
          ['paid', `Encaissées (${paidToday.length})`],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn('-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/25', tab === id ? 'border-ember text-ember' : 'border-transparent text-muted-foreground hover:text-foreground')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'paid' ? (
        paidToday.length === 0 ? (
          <Panel className="py-12 text-center text-sm text-muted-foreground">Aucun encaissement aujourd’hui.</Panel>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paidToday.map((o) => (
              <li key={o.id}>
                <Panel className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{tableLabel(o.table)} <span className="text-xs font-normal text-muted-foreground">#{o.number}</span></p>
                    <p className="text-xs text-muted-foreground">{time(o.payment!.at)} · {payMethodLabels[o.payment!.method]}</p>
                  </div>
                  <p className="font-semibold tabular-nums">{fcfa(o.total)}</p>
                  <button type="button" onClick={() => setReceipt(o)} aria-label={`Réimprimer le reçu de la commande ${o.number}`} className="inline-flex size-10 items-center justify-center rounded-full border border-border hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                    <ReceiptText className="size-4" aria-hidden="true" />
                  </button>
                </Panel>
              </li>
            ))}
          </ul>
        )
      ) : due.length === 0 ? (
        <Panel className="py-12 text-center text-sm text-muted-foreground">Rien à encaisser pour le moment.</Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_24rem] lg:items-start">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {due.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => select(o.id)}
                  aria-pressed={selected?.id === o.id}
                  className={cn(
                    'flex w-full flex-col gap-2 rounded-2xl border bg-card p-4 text-left shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)] transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30',
                    selected?.id === o.id ? 'border-ember ring-2 ring-ember/20' : 'border-border hover:border-ember/50',
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span>
                      <span className="block font-semibold">{tableLabel(o.table)}</span>
                      <span className="text-xs text-muted-foreground">#{o.number} · {time(o.createdAt)}</span>
                    </span>
                    <span className="font-serif text-xl font-semibold tabular-nums">{fcfa(o.total)}</span>
                  </span>
                  <span className="flex items-center justify-between">
                    <StatusBadge status={o.status} />
                    <span className="text-xs text-muted-foreground">{o.lines.reduce((s, l) => s + l.qty, 0)} article(s)</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <Panel className="lg:sticky lg:top-6">
              <h2 className="font-serif text-xl font-semibold">{tableLabel(selected.table)} <span className="text-sm font-normal text-muted-foreground">#{selected.number}</span></h2>
              <ul className="mt-3 divide-y divide-dashed divide-border text-sm">
                {selected.lines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-3 py-1.5">
                    <span>{l.qty} × {l.name}</span>
                    <span className="tabular-nums">{fcfa(l.qty * l.price)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Sous-total</dt><dd className="tabular-nums">{fcfa(selected.subtotal)}</dd></div>
                {selected.serviceFee > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Frais de service</dt><dd className="tabular-nums">{fcfa(selected.serviceFee)}</dd></div>}
                <div className="flex items-baseline justify-between border-t border-border pt-2"><dt className="font-serif text-lg font-semibold">Total</dt><dd className="font-serif text-2xl font-semibold tabular-nums text-ember-deep">{fcfa(selected.total)}</dd></div>
              </dl>

              <fieldset className="mt-4">
                <legend className="mb-1.5 text-sm font-medium">Mode de paiement</legend>
                <div className="grid grid-cols-3 gap-2">
                  {methods.map(({ id, icon: Icon }) => (
                    <label key={id} className={cn('flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2.5 text-center text-xs font-semibold transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ember/30', method === id ? 'border-ember bg-ember/10 text-ember' : 'border-border hover:border-ember/50')}>
                      <input type="radio" name="pay-method" value={id} checked={method === id} onChange={() => setMethod(id)} className="sr-only" />
                      <Icon className="size-5" aria-hidden="true" />
                      {payMethodLabels[id]}
                    </label>
                  ))}
                </div>
              </fieldset>

              {method === 'especes' && (
                <div className="mt-4">
                  <label htmlFor="received" className="mb-1 block text-sm font-medium">Montant reçu (FCFA)</label>
                  <input
                    id="received"
                    inputMode="numeric"
                    value={received}
                    onChange={(e) => setReceived(e.target.value.replace(/\D/g, ''))}
                    placeholder={String(selected.total)}
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-lg font-semibold tabular-nums outline-none focus:border-ember focus:ring-3 focus:ring-ember/20"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickAmounts(selected.total).map((v) => (
                      <button key={v} type="button" onClick={() => setReceived(String(v))} className="h-9 rounded-lg border border-border px-3 text-xs font-semibold tabular-nums hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                        {v === selected.total ? 'Montant exact' : fcfa(v)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 flex items-baseline justify-between text-sm" aria-live="polite">
                    <span className="text-muted-foreground">Monnaie à rendre</span>
                    <span className={cn('font-serif text-2xl font-semibold tabular-nums', receivedNumber >= selected.total ? 'text-success' : 'text-muted-foreground')}>
                      {receivedNumber >= selected.total ? fcfa(receivedNumber - selected.total) : '—'}
                    </span>
                  </p>
                </div>
              )}

              {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
              <button type="button" onClick={pay} disabled={!canPay} className={cn(primaryAction, 'mt-5 w-full disabled:opacity-50')}>
                Encaisser {fcfa(selected.total)}
              </button>
            </Panel>
          )}
        </div>
      )}

      {receipt && <ReceiptDialog order={receipt} settings={settings} onClose={() => setReceipt(null)} />}
      {sale && (
        <SaleDialog
          dishes={dishes}
          onClose={() => setSale(false)}
          onCreate={(lines) => {
            const created = ordersActions.create({ table: 'Comptoir', lines, source: 'comptoir' })
            if (created) {
              setTab('due')
              select(created.id)
            }
            setSale(false)
          }}
        />
      )}
    </>
  )
}
