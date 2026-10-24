import type { Report } from './reports'
import { change } from './reports'
import { fcfa } from './gerant-data'

const BRAND: [number, number, number] = [194, 65, 12]
const DARK: [number, number, number] = [58, 20, 7]
const MUTED: [number, number, number] = [110, 90, 75]
const LINE: [number, number, number] = [226, 214, 203]

const pct = (v: number | null) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v} %`)

/** Génère et télécharge le rapport au format PDF (A4). */
export async function exportReportPdf(report: Report, restaurantName: string, demo: boolean) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 15
  let y = 0
  let page = 1

  const footer = () => {
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED)
    doc.text(`${restaurantName} · Rapport généré par RestoBen le ${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`, M, 289)
    doc.text(`Page ${page}`, W - M, 289, { align: 'right' })
  }
  const ensure = (h: number) => {
    if (y + h > 280) {
      footer()
      doc.addPage()
      page += 1
      y = 20
    }
  }
  const heading = (text: string) => {
    ensure(14)
    doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...DARK)
    doc.text(text, M, y)
    doc.setDrawColor(...BRAND).setLineWidth(0.6).line(M, y + 1.8, M + 12, y + 1.8)
    y += 8
  }

  // en-tête
  doc.setFillColor(...BRAND).rect(0, 0, W, 8, 'F')
  y = 22
  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(...DARK)
  doc.text('Rapport des ventes', M, y)
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(...MUTED)
  doc.text(restaurantName, W - M, y, { align: 'right' })
  y += 8
  doc.setFontSize(12).setTextColor(...BRAND).setFont('helvetica', 'bold')
  doc.text(report.title, M, y)
  y += 5
  if (demo) {
    doc.setFont('helvetica', 'italic').setFontSize(8.5).setTextColor(...MUTED)
    doc.text('Ce rapport inclut des données de démonstration.', M, y + 2)
    y += 4
  }
  y += 6

  // indicateurs
  const kpis = [
    { label: 'Chiffre d’affaires', value: fcfa(report.revenue), delta: change(report.revenue, report.previous?.revenue) },
    { label: 'Commandes', value: String(report.count), delta: change(report.count, report.previous?.count) },
    { label: 'Panier moyen', value: fcfa(report.average), delta: change(report.average, report.previous?.average) },
    { label: 'Satisfaction clients', value: report.satisfaction ? `${report.satisfaction.average.toFixed(1).replace('.', ',')} / 5` : '—', delta: null },
  ]
  const cw = (W - 2 * M - 9) / 4
  kpis.forEach((k, i) => {
    const x = M + i * (cw + 3)
    doc.setDrawColor(...LINE).setFillColor(252, 248, 243).roundedRect(x, y, cw, 24, 2, 2, 'FD')
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED)
    doc.text(k.label, x + 3, y + 6)
    doc.setFont('helvetica', 'bold').setFontSize(i === 0 || i === 2 ? 10 : 13).setTextColor(...DARK)
    doc.text(k.value, x + 3, y + 14)
    if (k.delta !== null) {
      const tone: [number, number, number] = k.delta >= 0 ? [46, 125, 50] : [181, 51, 42]
      doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(...tone)
      doc.text(`${pct(k.delta)} vs période préc.`, x + 3, y + 20)
    }
  })
  y += 30
  if (report.partial) {
    doc.setFont('helvetica', 'italic').setFontSize(8).setTextColor(...MUTED)
    doc.text('Période en cours : la comparaison porte sur la même durée écoulée de la période précédente.', M, y)
    y += 6
  }
  if (report.peak) {
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...DARK)
    doc.text(`Heure de pointe : ${report.peak.label} (${fcfa(report.peak.value)})`, M, y)
    y += 8
  }

  // graphique
  heading(report.seriesTitle)
  const chartH = 42
  const chartW = W - 2 * M
  const max = Math.max(...report.series.map((s) => s.value), 1)
  const n = report.series.length
  const gap = n > 20 ? 0.6 : 1.5
  const bw = (chartW - gap * (n - 1)) / n
  doc.setDrawColor(...LINE).setLineWidth(0.2).line(M, y + chartH, M + chartW, y + chartH)
  report.series.forEach((s, i) => {
    const h = (s.value / max) * (chartH - 4)
    const x = M + i * (bw + gap)
    doc.setFillColor(...BRAND).rect(x, y + chartH - h, bw, h, 'F')
    if (n <= 16 || i % 5 === 0) {
      doc.setFont('helvetica', 'normal').setFontSize(n > 16 ? 6.5 : 7).setTextColor(...MUTED)
      doc.text(s.label, x + bw / 2, y + chartH + 4, { align: 'center' })
    }
  })
  y += chartH + 12

  const drawRow = (a: string, b: string, bold = false, shade = false) => {
    ensure(7)
    if (shade) doc.setFillColor(250, 245, 239).rect(M, y - 4.5, W - 2 * M, 6.5, 'F')
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(9.5).setTextColor(...DARK)
    doc.text(a, M + 2, y)
    doc.text(b, W - M - 2, y, { align: 'right' })
    y += 6.5
  }

  // top performances
  heading('Top performances')
  drawRow('Top plat', report.topDish ? `${report.topDish.name} · ${report.topDish.qty} vendus` : '—', false, true)
  drawRow('Meilleure table', report.bestTable ? `Table ${report.bestTable.table} · ${fcfa(report.bestTable.revenue)}` : '—')
  drawRow('Plats vendus', String(report.itemsSold), false, true)
  y += 6

  // indicateurs clés
  const prev = report.previous
  const pts = (cur: number | null, before: number | null | undefined, dec = 0) => {
    if (cur === null || before === null || before === undefined) return ''
    const d = Math.round((cur - before) * 10 ** dec) / 10 ** dec
    return `  (${d > 0 ? '+' : ''}${String(d).replace('.', ',')} pt vs préc.)`
  }
  heading('Indicateurs clés')
  drawRow('Taux d’occupation des tables', report.occupancy === null ? '—' : `${report.occupancy} %${pts(report.occupancy, prev?.occupancy)}`, false, true)
  drawRow('Temps moyen de service', report.serviceMin === null ? '—' : `${report.serviceMin} min`)
  drawRow('Taux d’annulation', report.cancelRate === null ? '—' : `${String(report.cancelRate).replace('.', ',')} %${pts(report.cancelRate, prev?.cancelRate, 1)}`, false, true)
  y += 6

  // détail de la série
  heading('Détail des ventes')
  const rows = report.series.filter((s) => s.value > 0)
  if (rows.length === 0) drawRow('Aucune vente sur cette période.', '')
  rows.forEach((s, i) => drawRow(s.full, fcfa(s.value), false, i % 2 === 0))
  drawRow('Total', fcfa(report.revenue), true)
  y += 6

  // plats
  heading('Classement des plats')
  if (report.topDishes.length === 0) drawRow('Aucune vente sur cette période.', '')
  report.topDishes.forEach((d, i) => {
    ensure(7)
    if (i % 2 === 0) doc.setFillColor(250, 245, 239).rect(M, y - 4.5, W - 2 * M, 6.5, 'F')
    doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...DARK)
    doc.text(`${i + 1}. ${d.name}`, M + 2, y)
    doc.text(`${d.qty} vendus`, W - M - 45, y, { align: 'right' })
    doc.text(fcfa(d.revenue), W - M - 2, y, { align: 'right' })
    y += 6.5
  })
  y += 6

  // paiements
  heading('Modes de paiement')
  report.byMethod.forEach((m, i) => {
    ensure(7)
    if (i % 2 === 0) doc.setFillColor(250, 245, 239).rect(M, y - 4.5, W - 2 * M, 6.5, 'F')
    doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...DARK)
    doc.text(m.label, M + 2, y)
    doc.text(`${m.count} paiements · ${report.revenue ? Math.round((m.total / report.revenue) * 100) : 0} %`, W - M - 45, y, { align: 'right' })
    doc.text(fcfa(m.total), W - M - 2, y, { align: 'right' })
    y += 6.5
  })

  footer()
  const slug = report.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  doc.save(`rapport-${slug}.pdf`)
}
