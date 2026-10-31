'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Copy, Download, ExternalLink, Printer, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RestaurantTable } from '@/lib/gerant-data'
import { makeQr, printPosters } from '@/lib/qr-print'
import { normalizeSiteUrl, saveSettings, tableNumber, tableUrl, useSettings } from '@/lib/settings-store'
import { ordersActions } from '@/lib/orders-store'
import { Panel, ScreenHeader, iconButton, primaryAction } from './shared'
import { RolesPanel } from './roles-panel'

const fieldClass =
  'h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ember focus:ring-3 focus:ring-ember/20'

const smallAction =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold transition-colors hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30'

export function SettingsScreen({ tables, focusQr, onBack, canEditRoles = false }: { tables: RestaurantTable[]; focusQr: boolean; onBack: () => void; canEditRoles?: boolean }) {
  const settings = useSettings()
  const [name, setName] = useState(settings.restaurantName)
  const [site, setSite] = useState(settings.siteUrl)
  const [address, setAddress] = useState(settings.address)
  const [phone, setPhone] = useState(settings.phone)
  const [footer, setFooter] = useState(settings.receiptFooter)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [origin, setOrigin] = useState('')
  const [qrs, setQrs] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)
  const [printError, setPrintError] = useState('')
  const qrRef = useRef<HTMLElement>(null)

  useEffect(() => setOrigin(window.location.origin), [])

  useEffect(() => {
    if (focusQr) {
      qrRef.current?.scrollIntoView({ block: 'start' })
      qrRef.current?.focus({ preventScroll: true })
    }
  }, [focusQr])

  const base = settings.siteUrl || origin
  const isLocal = /localhost|127\.0\.0\.1|192\.168\./.test(base)
  const list = base ? tables.map((t) => ({ id: t.id, number: tableNumber(t.id), url: tableUrl(base, t.id, settings.restaurantSlug) })) : []
  const urlsKey = list.map((t) => t.url).join('|')

  useEffect(() => {
    let cancelled = false
    Promise.all(list.map(async (t) => [t.url, await makeQr(t.url)] as const)).then((entries) => {
      if (!cancelled) setQrs(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlsKey])

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setMessage({ type: 'error', text: 'Indiquez le nom du restaurant.' })
    const normalized = normalizeSiteUrl(site)
    if (site.trim() && !normalized) return setMessage({ type: 'error', text: 'Cette adresse n’est pas valide. Exemple : https://monrestaurant.com' })
    const ok = saveSettings({ ...settings, restaurantName: name.trim(), siteUrl: normalized, address: address.trim(), phone: phone.trim(), receiptFooter: footer.trim() })
    if (!ok) return setMessage({ type: 'error', text: 'Enregistrement impossible : la mémoire du navigateur est pleine.' })
    setSite(normalized)
    setMessage({ type: 'ok', text: 'Paramètres enregistrés.' })
  }

  async function download(t: { number: string; url: string }) {
    const png = await makeQr(t.url, 1024)
    const a = document.createElement('a')
    a.href = png
    a.download = `qr-table-${t.number}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function copy(t: { id: string; url: string }) {
    try {
      await navigator.clipboard.writeText(t.url)
      setCopied(t.id)
      window.setTimeout(() => setCopied((c) => (c === t.id ? null : c)), 2000)
    } catch {
      window.prompt('Copiez ce lien :', t.url)
    }
  }

  async function printAll() {
    setPrinting(true)
    setPrintError('')
    try {
      const ok = await printPosters(settings.restaurantName, list)
      if (!ok) setPrintError('Impossible d’ouvrir la page d’impression. Autorisez les fenêtres pop-up pour ce site, puis réessayez.')
    } catch {
      setPrintError('La génération des affiches a échoué. Réessayez.')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <>
      <ScreenHeader
        title="Paramètres"
        subtitle="Informations du restaurant et QR codes des tables."
        actions={
          <button type="button" onClick={onBack} className={iconButton} aria-label="Retour au menu Plus">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
        }
      />

      <div className="grid gap-4">
        <Panel>
          <h2 className="font-serif text-xl font-semibold">Votre restaurant</h2>
          <form onSubmit={save} noValidate className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="resto-name" className="mb-1 block text-sm font-medium">
                Nom du restaurant
              </label>
              <input id="resto-name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
              <p className="mt-1 text-xs text-muted-foreground">Affiché aux clients et sur les affiches.</p>
            </div>
            <div>
              <label htmlFor="resto-site" className="mb-1 block text-sm font-medium">
                Adresse du site
              </label>
              <input id="resto-site" value={site} onChange={(e) => setSite(e.target.value)} placeholder={origin || 'https://monrestaurant.com'} inputMode="url" autoCapitalize="none" className={fieldClass} />
              <p className="mt-1 text-xs text-muted-foreground">Celle que les clients ouvrent en scannant. Laissez vide pour utiliser l’adresse actuelle.</p>
            </div>
            <div>
              <label htmlFor="resto-address" className="mb-1 block text-sm font-medium">
                Adresse (reçus)
              </label>
              <input id="resto-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex. Rue des Cocotiers, Cotonou" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="resto-phone" className="mb-1 block text-sm font-medium">
                Téléphone (reçus)
              </label>
              <input id="resto-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Ex. +229 01 00 00 00 00" className={fieldClass} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="resto-footer" className="mb-1 block text-sm font-medium">
                Message en bas du reçu
              </label>
              <input id="resto-footer" value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Merci de votre visite !" className={fieldClass} />
            </div>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <button type="submit" className={cn(primaryAction, 'h-11')}>
                Enregistrer
              </button>
              {message && (
                <p role={message.type === 'error' ? 'alert' : 'status'} className={cn('inline-flex items-center gap-1.5 text-sm font-medium', message.type === 'error' ? 'text-destructive' : 'text-success')}>
                  {message.type === 'ok' && <Check className="size-4" aria-hidden="true" />}
                  {message.text}
                </p>
              )}
            </div>
          </form>
        </Panel>

        <section ref={qrRef} tabIndex={-1} aria-labelledby="qr-title" className="scroll-mt-6 outline-none">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="qr-title" className="font-serif text-xl font-semibold">
                  QR codes des tables
                </h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Un QR code par table. Le client le scanne et arrive directement sur le menu, avec le numéro de sa table. Une table ajoutée dans l’onglet Tables apparaît ici.
                </p>
              </div>
              <button type="button" onClick={printAll} disabled={printing || list.length === 0} className={cn(primaryAction, 'h-11 disabled:opacity-50')}>
                <Printer className="size-4" aria-hidden="true" />
                {printing ? 'Préparation…' : 'Imprimer les affiches'}
              </button>
            </div>

            {printError && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {printError}
              </p>
            )}

            {isLocal && (
              <p className="mt-4 flex gap-2 rounded-xl bg-gold/15 p-3 text-sm text-[#6b4510]">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Ces QR codes pointent vers <strong>{base}</strong>, une adresse qui ne fonctionne que sur cet appareil. Renseignez l’adresse publique du site ci-dessus avant d’imprimer.
                </span>
              </p>
            )}

            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => (
                <li key={t.id} className="flex flex-col items-center rounded-2xl border border-border bg-background p-4 text-center">
                  <p className="font-serif text-xl font-semibold">Table {t.number}</p>
                  <div className="mt-3 flex size-40 items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
                    {qrs[t.url] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrs[t.url]} alt={`QR code de la table ${t.number}`} width={160} height={160} className="size-full" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Génération…</span>
                    )}
                  </div>
                  <p className="mt-2 w-full truncate text-xs text-muted-foreground" title={t.url}>
                    {t.url}
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => download(t)} className={smallAction} aria-label={`Télécharger le QR code de la table ${t.number}`}>
                      <Download className="size-3.5" aria-hidden="true" />
                      PNG
                    </button>
                    <button type="button" onClick={() => copy(t)} className={smallAction} aria-label={`Copier le lien de la table ${t.number}`}>
                      {copied === t.id ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                      {copied === t.id ? 'Copié' : 'Lien'}
                    </button>
                    <a href={t.url} target="_blank" rel="noopener noreferrer" className={smallAction} aria-label={`Tester la table ${t.number} (nouvel onglet)`}>
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                      Tester
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        {canEditRoles && <RolesPanel />}

        {settings.demoData && (
          <Panel>
            <h2 className="font-serif text-xl font-semibold">Données de démonstration</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Des commandes et un historique de ventes fictifs sont affichés pour vous montrer l’application. Quand vous êtes prêt à travailler pour de vrai, supprimez-les : seules vos vraies commandes resteront.
            </p>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm('Supprimer toutes les données de démonstration ?')) return
                ordersActions.clearDemo()
                saveSettings({ ...settings, demoData: false })
              }}
              className="mt-4 inline-flex h-11 items-center rounded-xl border border-destructive/40 px-5 text-sm font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/30"
            >
              Supprimer les données de démonstration
            </button>
          </Panel>
        )}
      </div>
    </>
  )
}
