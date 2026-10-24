import { type Account, billingPeriod } from './account-store'
import { legal } from './legal-info'
import { amountDue, formatFCFA, getPlan } from './plans'

const BRAND: [number, number, number] = [194, 65, 12]
const DARK: [number, number, number] = [58, 20, 7]
const MUTED: [number, number, number] = [110, 90, 75]
const LINE: [number, number, number] = [226, 214, 203]

const money = (value: number) => `${formatFCFA(value).replace(/[\u202f\u00a0]/g, ' ')} FCFA`
const day = (at: number) => new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Numéro de facture lisible, stable pour une période donnée. */
export function invoiceNumber(account: Pick<Account, 'createdAt'>, periodStart: number) {
  const d = new Date(periodStart)
  return `RB-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(account.createdAt % 10000).padStart(4, '0')}`
}

/** Génère et télécharge la facture de la période d'abonnement en cours (PDF A4). */
export async function exportInvoicePdf(account: Account, restaurantName: string, phone: string, demo: boolean) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 18
  const plan = getPlan(account.planId)
  const { start, next } = billingPeriod(account)
  const number = invoiceNumber(account, start)
  const total = amountDue(plan, account.billing)
  const periodLabel = `Du ${day(start)} au ${day(next - 86_400_000)}`

  doc.setFillColor(...BRAND).rect(0, 0, W, 8, 'F')

  // En-tête
  let y = 26
  doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(...DARK)
  doc.text('FACTURE', M, y)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...MUTED)
  doc.text(`N° ${number}`, W - M, y - 6, { align: 'right' })
  doc.text(`Date : ${day(start)}`, W - M, y, { align: 'right' })
  doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(...BRAND)
  doc.text('RestoBen', M, y + 8)

  // Émetteur / client
  y = 54
  const block = (x: number, title: string, lines: (string | undefined)[]) => {
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...BRAND)
    doc.text(title.toUpperCase(), x, y)
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...DARK)
    lines.filter((l): l is string => !!l).forEach((l, i) => doc.text(l, x, y + 6 + i * 5.2))
  }
  block(M, 'Émetteur', [legal.company, legal.address, legal.email, legal.phone, legal.rccm ? `RCCM : ${legal.rccm}` : undefined, legal.ifu ? `IFU : ${legal.ifu}` : undefined])
  block(W / 2 + 4, 'Facturé à', [restaurantName, account.manager, account.email, phone || account.phone, account.establishment])

  // Tableau
  y = 104
  doc.setFillColor(252, 248, 243).setDrawColor(...LINE).rect(M, y, W - 2 * M, 9, 'FD')
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...MUTED)
  doc.text('DÉSIGNATION', M + 3, y + 6)
  doc.text('PÉRIODE', M + 86, y + 6)
  doc.text('MONTANT', W - M - 3, y + 6, { align: 'right' })
  y += 9
  doc.setDrawColor(...LINE).rect(M, y, W - 2 * M, 16)
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...DARK)
  doc.text(`Abonnement RestoBen ${plan.name}`, M + 3, y + 6.5)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED)
  doc.text(`Facturation ${account.billing === 'annuel' ? 'annuelle' : 'mensuelle'}`, M + 3, y + 11.5)
  const period = doc.splitTextToSize(periodLabel, 44) as string[]
  doc.text(period, M + 86, y + 6.5)
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...DARK)
  doc.text(money(total), W - M - 3, y + 6.5, { align: 'right' })
  y += 16

  // Total
  y += 8
  doc.setFillColor(...BRAND).roundedRect(W - M - 72, y, 72, 14, 2, 2, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(255, 255, 255)
  doc.text('TOTAL', W - M - 68, y + 9)
  doc.setFontSize(12)
  doc.text(money(total), W - M - 4, y + 9, { align: 'right' })

  // Paiement
  y += 28
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...BRAND)
  doc.text('PAIEMENT', M, y)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...DARK)
  doc.text(`Mode de paiement : ${account.paymentMethod}`, M, y + 6)
  doc.text(`Statut : payée le ${day(start)}`, M, y + 11.2)
  doc.text(`Prochain paiement : ${day(next)}`, M, y + 16.4)

  // Pied de page
  doc.setDrawColor(...LINE).line(M, 276, W - M, 276)
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED)
  doc.text(`${legal.company} · ${legal.address} · ${legal.email}`, M, 282)
  if (demo) doc.text('Document généré en mode démonstration : aucun paiement réel n’a été effectué.', M, 287)

  doc.save(`facture-restoben-${number}.pdf`)
}
