import { fcfa } from './gerant-data'
import { payMethodLabels, tableLabel, type StoreOrder } from './orders-store'

export type ReceiptInfo = { name: string; address: string; phone: string; footer: string }

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
const num = (n: number) => n.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')

/** Reçu au format ticket (80 mm), prêt à être affiché dans un cadre puis imprimé. */
export function receiptHtml(info: ReceiptInfo, order: StoreOrder): string {
  const paid = order.payment
  const when = new Date(paid?.at ?? order.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  const lines = order.lines
    .map(
      (l) => `<div class="row"><span class="l">${l.qty} × ${esc(l.name)}</span><span>${num(l.qty * l.price)}</span></div>
      ${l.qty > 1 ? `<div class="sub">${num(l.price)} l’unité</div>` : ''}`,
    )
    .join('')

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>Reçu ${esc(order.number)}</title>
<style>
  @page { size: 80mm auto; margin: 0 }
  * { box-sizing: border-box }
  html, body { margin: 0; background: #fff }
  body { width: 80mm; padding: 6mm 5mm 8mm; font: 12px/1.45 'Courier New', Courier, monospace; color: #000 }
  .c { text-align: center }
  .name { font-size: 17px; font-weight: 700; letter-spacing: .02em }
  .muted { font-size: 11px }
  hr { border: 0; border-top: 1px dashed #000; margin: 8px 0 }
  .row { display: flex; justify-content: space-between; gap: 8px }
  .row .l { flex: 1 }
  .sub { font-size: 10px; padding-left: 14px; color: #333 }
  .total { font-size: 16px; font-weight: 700; margin-top: 2px }
  .thanks { margin-top: 10px; font-weight: 700 }
  @media screen { body { margin: 0 auto } }
</style></head><body>
  <div class="c">
    <div class="name">${esc(info.name)}</div>
    ${info.address ? `<div class="muted">${esc(info.address)}</div>` : ''}
    ${info.phone ? `<div class="muted">Tél. ${esc(info.phone)}</div>` : ''}
  </div>
  <hr/>
  <div class="row"><span>Ticket n° ${esc(order.number)}</span><span>${esc(tableLabel(order.table))}</span></div>
  <div class="muted">${esc(when)}</div>
  <hr/>
  ${lines}
  <hr/>
  <div class="row"><span>Sous-total</span><span>${num(order.subtotal)}</span></div>
  ${order.serviceFee > 0 ? `<div class="row"><span>Frais de service</span><span>${num(order.serviceFee)}</span></div>` : ''}
  <div class="row total"><span>TOTAL</span><span>${esc(fcfa(order.total))}</span></div>
  <hr/>
  ${
    paid
      ? `<div class="row"><span>Paiement</span><span>${esc(payMethodLabels[paid.method])}</span></div>
  ${paid.method === 'especes' ? `<div class="row"><span>Reçu</span><span>${num(paid.received)}</span></div><div class="row"><span>Rendu</span><span>${num(paid.change)}</span></div>` : ''}`
      : '<div class="c">À payer</div>'
  }
  <hr/>
  <div class="c thanks">${esc(info.footer || 'Merci de votre visite !')}</div>
  <div class="c muted" style="margin-top:6px">RestoBen</div>
</body></html>`
}
