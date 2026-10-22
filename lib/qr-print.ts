import QRCode from 'qrcode'

export type QrTable = { id: string; number: string; url: string }

const QR_COLORS = { dark: '#3a1407', light: '#ffffff' }

export function makeQr(url: string, width = 480): Promise<string> {
  return QRCode.toDataURL(url, { width, margin: 2, errorCorrectionLevel: 'M', color: QR_COLORS })
}

function esc(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

/** Ouvre une page avec une affiche par table (une par feuille) et lance l'impression. Renvoie false si la fenêtre est bloquée. */
export async function printPosters(restaurantName: string, tables: QrTable[]): Promise<boolean> {
  const images = await Promise.all(tables.map((t) => makeQr(t.url, 900)))
  const posters = tables
    .map(
      (t, i) => `
    <section class="poster">
      <p class="brand">${esc(restaurantName)}</p>
      <h1>Scannez pour commander</h1>
      <img src="${images[i]}" alt="QR code de la table ${esc(t.number)}" />
      <p class="table">Table ${esc(t.number)}</p>
      <p class="hint">Ouvrez l’appareil photo de votre téléphone et pointez-le vers le code.<br/>Aucun compte à créer.</p>
      <p class="foot">Propulsé par RestoBen</p>
    </section>`,
    )
    .join('')

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>Affiches QR – ${esc(restaurantName)}</title>
<style>
  @page { size: A5; margin: 0 }
  * { box-sizing: border-box }
  body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #3a1407; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  .poster { width: 148mm; height: 210mm; padding: 14mm 12mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-after: always; break-after: page; border-top: 6mm solid #c2410c }
  .poster:last-child { page-break-after: auto; break-after: auto }
  .brand { margin: 0; font-size: 20pt; letter-spacing: .04em; color: #c2410c; font-weight: 700 }
  h1 { margin: 8mm 0 6mm; font-size: 26pt; line-height: 1.15 }
  img { width: 88mm; height: 88mm; border: 1px solid #e7d9cc; border-radius: 6mm }
  .table { margin: 7mm 0 0; font-size: 30pt; font-weight: 700 }
  .hint { margin: 5mm 0 0; font: 11pt/1.5 Arial, sans-serif; color: #5b4636 }
  .foot { margin: 10mm 0 0; font: 9pt Arial, sans-serif; color: #8a7565 }
  @media screen { body { background: #f4ece4 } .poster { margin: 10px auto; background: #fff } }
</style></head><body>${posters}
<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`

  const win = window.open('', '_blank')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  return true
}
