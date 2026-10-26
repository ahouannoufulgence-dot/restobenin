'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUp,
  Bell,
  Beef,
  Box,
  Camera,
  Carrot,
  Clock,
  CupSoda,
  Droplet,
  Filter,
  Fish,
  Flame,
  Plus,
  Search,
  ShieldCheck,
  Sprout,
  TriangleAlert,
  Trash2,
  Wheat,
  X,
  CircleDollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Photo } from '@/components/ui/photo'
import { photoToDataUrl } from '@/lib/image-resize'
import {
  formatQty,
  kindLabels,
  levelOf,
  stockActions,
  summarize,
  units,
  type MovementType,
  type StockItem,
  type StockKind,
  type StockLevel,
  type StockMovement,
  type StockUnit,
} from '@/lib/stock-store'
import { BrandMark } from './dashboard-screen'
import { Modal } from './shared'

const kindStyle: Record<StockKind, { icon: LucideIcon; tile: string; color: string }> = {
  legume: { icon: Carrot, tile: 'from-[#fbe3d8] to-[#f2b9a3]', color: 'text-[#b3321c]' },
  tubercule: { icon: Sprout, tile: 'from-[#f1e4cf] to-[#dcc29a]', color: 'text-[#7a5526]' },
  cereale: { icon: Wheat, tile: 'from-[#f8ecc9] to-[#e8cd86]', color: 'text-[#8a6513]' },
  huile: { icon: Droplet, tile: 'from-[#fbf0b8] to-[#eccb4f]', color: 'text-[#9a6a00]' },
  viande: { icon: Beef, tile: 'from-[#f7d9d6] to-[#e49b97]', color: 'text-[#a3282a]' },
  poisson: { icon: Fish, tile: 'from-[#dbe8ee] to-[#a9c6d3]', color: 'text-[#2f647a]' },
  boisson: { icon: CupSoda, tile: 'from-[#f1d7e0] to-[#d995ad]', color: 'text-[#8d2a52]' },
  epice: { icon: Flame, tile: 'from-[#fbdcc2] to-[#f0a56e]', color: 'text-[#b4440c]' },
}

const levelStyle: Record<StockLevel, { label: string; pill: string; dot: string }> = {
  ok: { label: 'En stock', pill: 'bg-success/12 text-success', dot: 'bg-success' },
  faible: { label: 'Stock faible', pill: 'bg-ember/12 text-ember-deep', dot: 'bg-ember' },
  critique: { label: 'Critique', pill: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
}

type Filter = 'tous' | 'alertes' | StockLevel

const fieldClass =
  'h-11 w-full rounded-xl border border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground focus:border-ember focus:ring-3 focus:ring-ember/20 sm:text-sm'

const card = 'rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]'

const num = (value: number) => value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')

function parseNumber(value: string) {
  return Number(value.trim().replace(/\s/g, '').replace(',', '.'))
}

function whenLabel(at: number, now: number) {
  const d = new Date(at)
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const day = (t: number) => new Date(t).setHours(0, 0, 0, 0)
  const diff = Math.round((day(now) - day(at)) / 86_400_000)
  if (diff === 0) return `Aujourd’hui, ${time}`
  if (diff === 1) return `Hier, ${time}`
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, ${time}`
}

function Thumb({ item, className }: { item: Pick<StockItem, 'kind' | 'image'>; className?: string }) {
  if (item.image) {
    return <Photo src={item.image} className={cn('shrink-0', className)} sizes="128px" />
  }
  const { icon: Icon, tile, color } = kindStyle[item.kind]
  return (
    <span aria-hidden="true" className={cn('flex shrink-0 items-center justify-center bg-gradient-to-br', tile, color, className)}>
      <Icon className="size-7" strokeWidth={1.6} />
    </span>
  )
}

function LevelPill({ level }: { level: StockLevel }) {
  const s = levelStyle[level]
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium sm:text-xs', s.pill)}>
      <span className={cn('size-2 rounded-full', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  )
}

const labelClass = 'mb-1.5 block text-sm font-medium text-foreground/85'
const primary =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember to-ember-deep px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-ember-deep/25 transition-colors hover:from-ember-deep hover:to-ember-deep focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/35'

function MovementDialog({ items, initialItemId, onClose }: { items: StockItem[]; initialItemId?: string; onClose: () => void }) {
  const [itemId, setItemId] = useState(initialItemId ?? items[0]?.id ?? '')
  const [type, setType] = useState<MovementType>('entree')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const qtyRef = useRef<HTMLInputElement>(null)
  const item = items.find((i) => i.id === itemId)
  const amount = parseNumber(qty)
  const after = item && Number.isFinite(amount) && amount > 0 ? (type === 'entree' ? item.qty + amount : item.qty - amount) : null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const result = stockActions.addMovement(itemId, type, amount, note)
    if (!result.ok) {
      setError(result.error)
      qtyRef.current?.focus()
      return
    }
    onClose()
  }

  return (
    <Modal title="Ajouter un mouvement" onClose={onClose}>
      {items.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">Ajoutez d’abord un article pour enregistrer des mouvements.</p>
      ) : (
        <form onSubmit={submit} noValidate className="mt-5 grid gap-4">
          <div>
            <label htmlFor="mv-item" className={labelClass}>Article</label>
            <select id="mv-item" value={itemId} onChange={(e) => { setItemId(e.target.value); setError('') }} className={fieldClass}>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({formatQty(i.qty)} {i.unit})</option>
              ))}
            </select>
          </div>

          <div role="radiogroup" aria-label="Type de mouvement" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
            {([['entree', 'Entrée', ArrowDownToLine], ['sortie', 'Sortie', ArrowUpFromLine]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                onClick={() => { setType(value); setError('') }}
                className={cn(
                  'inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/35',
                  type === value ? 'bg-ember text-primary-foreground shadow-md shadow-ember/25' : 'text-foreground/80 hover:bg-muted/60',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="mv-qty" className={labelClass}>Quantité{item ? ` (${item.unit})` : ''}</label>
            <input
              ref={qtyRef}
              id="mv-qty"
              inputMode="decimal"
              autoComplete="off"
              value={qty}
              onChange={(e) => { setQty(e.target.value); setError('') }}
              placeholder="Ex. 10"
              aria-invalid={!!error}
              className={cn(fieldClass, error && 'border-destructive')}
            />
            {after !== null && item && (
              <p className={cn('mt-1.5 text-sm', after < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                {after < 0 ? 'Stock insuffisant.' : `Après le mouvement : ${formatQty(Math.round(after * 100) / 100)} ${item.unit}`}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="mv-note" className={labelClass}>Note (facultatif)</label>
            <input id="mv-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} autoComplete="off" placeholder="Livraison, service du soir…" className={fieldClass} />
          </div>

          {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}

          <button type="submit" className={primary}>Enregistrer</button>
        </form>
      )}
    </Modal>
  )
}

function HistoryDialog({ movements, onClose }: { movements: StockMovement[]; onClose: () => void }) {
  const [now] = useState(() => Date.now())
  return (
    <Modal title="Historique des mouvements" onClose={onClose}>
      {movements.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">Aucun mouvement enregistré pour le moment.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {movements.map((m) => {
            const entree = m.type === 'entree'
            return (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-full', entree ? 'bg-success/12 text-success' : 'bg-ember/12 text-ember-deep')}>
                  {entree ? <ArrowDownToLine className="size-5" aria-hidden="true" /> : <ArrowUpFromLine className="size-5" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{entree ? 'Entrée' : 'Sortie'} – {m.itemName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {whenLabel(m.at, now)}
                    {m.note ? ` · ${m.note}` : ''}
                  </span>
                </span>
                <span className={cn('whitespace-nowrap text-sm font-semibold tabular-nums', entree ? 'text-success' : 'text-ember-deep')}>
                  {entree ? '+' : '−'}{formatQty(m.qty)} {m.unit}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}

type Draft = { id: string; name: string; kind: StockKind; unit: StockUnit; qty: string; threshold: string; unitCost: string; image?: string; trend: number }

function ItemDialog({ item, items, onClose, onMovement }: { item: StockItem | null; items: StockItem[]; onClose: () => void; onMovement: (id: string) => void }) {
  const isNew = !item
  const [draft, setDraft] = useState<Draft>(
    item
      ? { id: item.id, name: item.name, kind: item.kind, unit: item.unit, qty: String(item.qty), threshold: String(item.threshold), unitCost: String(item.unitCost), image: item.image, trend: item.trend }
      : { id: stockActions.newId(), name: '', kind: 'legume', unit: 'kg', qty: '', threshold: '', unitCost: '', trend: 0 },
  )
  const [errors, setErrors] = useState<Partial<Record<'name' | 'qty' | 'threshold' | 'unitCost' | 'form', string>>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  useEffect(() => nameRef.current?.focus(), [])
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      set('image', await photoToDataUrl(file, 320, 0.8))
      setErrors((x) => ({ ...x, form: undefined }))
    } catch (err) {
      setErrors((x) => ({ ...x, form: err instanceof Error ? err.message : 'Photo impossible à lire.' }))
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    const qty = parseNumber(draft.qty === '' ? '0' : draft.qty)
    const threshold = parseNumber(draft.threshold)
    const unitCost = parseNumber(draft.unitCost === '' ? '0' : draft.unitCost)
    if (draft.name.trim().length < 2) next.name = 'Indiquez le nom de l’article.'
    else if (items.some((i) => i.id !== draft.id && i.name.trim().toLowerCase() === draft.name.trim().toLowerCase())) next.name = 'Un article porte déjà ce nom.'
    if (!Number.isFinite(qty) || qty < 0) next.qty = 'Quantité invalide.'
    if (!Number.isFinite(threshold) || threshold <= 0) next.threshold = 'Indiquez un seuil supérieur à zéro.'
    if (!Number.isFinite(unitCost) || unitCost < 0) next.unitCost = 'Prix invalide.'
    setErrors(next)
    if (Object.keys(next).length) return
    const saved = stockActions.saveItem({
      id: draft.id,
      name: draft.name.trim().replace(/\s+/g, ' '),
      kind: draft.kind,
      unit: draft.unit,
      qty,
      threshold,
      unitCost,
      trend: draft.trend,
      image: draft.image,
    })
    if (!saved) return setErrors({ form: 'Enregistrement impossible : le stockage du navigateur est plein.' })
    onClose()
  }

  function remove() {
    if (!item) return
    if (!confirmDelete) return setConfirmDelete(true)
    stockActions.removeItem(item.id)
    onClose()
  }

  const err = (m?: string) => (m ? <p className="mt-1.5 text-sm text-destructive">{m}</p> : null)

  return (
    <Modal title={isNew ? 'Nouvel article' : 'Modifier l’article'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="mt-5 grid gap-4">
        {errors.form && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{errors.form}</p>}

        <div className="flex items-center gap-4">
          <Thumb item={draft} className="size-16 rounded-xl" />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:border-ember hover:text-ember focus-within:ring-3 focus-within:ring-ember/30">
              <Camera className="size-4" aria-hidden="true" />
              {draft.image ? 'Changer la photo' : 'Ajouter une photo'}
              <input type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
            </label>
            {draft.image && (
              <button type="button" onClick={() => set('image', undefined)} className="inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:text-destructive">
                Retirer
              </button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="it-name" className={labelClass}>Nom de l’article</label>
          <input ref={nameRef} id="it-name" value={draft.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" placeholder="Ex. Tomates" aria-invalid={!!errors.name} className={cn(fieldClass, errors.name && 'border-destructive')} />
          {err(errors.name)}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="it-kind" className={labelClass}>Catégorie</label>
            <select id="it-kind" value={draft.kind} onChange={(e) => set('kind', e.target.value as StockKind)} className={fieldClass}>
              {(Object.keys(kindLabels) as StockKind[]).map((k) => (
                <option key={k} value={k}>{kindLabels[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="it-unit" className={labelClass}>Unité</label>
            <select id="it-unit" value={draft.unit} onChange={(e) => set('unit', e.target.value as StockUnit)} className={fieldClass}>
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="it-qty" className={labelClass}>{isNew ? 'Quantité initiale' : 'Quantité en stock'}</label>
            <input id="it-qty" inputMode="decimal" value={draft.qty} onChange={(e) => set('qty', e.target.value)} autoComplete="off" placeholder="0" aria-invalid={!!errors.qty} className={cn(fieldClass, errors.qty && 'border-destructive')} />
            {err(errors.qty)}
          </div>
          <div>
            <label htmlFor="it-threshold" className={labelClass}>Seuil d’alerte</label>
            <input id="it-threshold" inputMode="decimal" value={draft.threshold} onChange={(e) => set('threshold', e.target.value)} autoComplete="off" placeholder="Ex. 20" aria-invalid={!!errors.threshold} className={cn(fieldClass, errors.threshold && 'border-destructive')} />
            {err(errors.threshold)}
          </div>
        </div>

        <div>
          <label htmlFor="it-cost" className={labelClass}>Prix d’achat par {draft.unit} (FCFA)</label>
          <input id="it-cost" inputMode="numeric" value={draft.unitCost} onChange={(e) => set('unitCost', e.target.value)} autoComplete="off" placeholder="Ex. 600" aria-invalid={!!errors.unitCost} className={cn(fieldClass, errors.unitCost && 'border-destructive')} />
          {err(errors.unitCost)}
        </div>

        <div className="grid gap-3">
          <button type="submit" className={primary}>{isNew ? 'Ajouter l’article' : 'Enregistrer'}</button>
          {!isNew && (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button type="button" onClick={remove} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/25">
                <Trash2 className="size-4" aria-hidden="true" />
                {confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}
              </button>
              <button type="button" onClick={() => item && onMovement(item.id)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                <Plus className="size-4" aria-hidden="true" />
                Ajouter un mouvement
              </button>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}

export function StockScreen({ items, movements }: { items: StockItem[]; movements: StockMovement[] }) {
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('tous')
  const [dialog, setDialog] = useState<null | { type: 'movement'; itemId?: string } | { type: 'history' } | { type: 'item'; item: StockItem | null }>(null)
  const [showAll, setShowAll] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const lastCount = useRef(items.length)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  // Un article vient d'être ajouté : on affiche toute la liste pour qu'il soit visible.
  useEffect(() => {
    if (items.length > lastCount.current) setShowAll(true)
    lastCount.current = items.length
  }, [items.length])

  const summary = useMemo(() => summarize(items), [items])
  const counts = useMemo(() => {
    const c = { ok: 0, faible: 0, critique: 0 }
    for (const i of items) c[levelOf(i)] += 1
    return c
  }, [items])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      const level = levelOf(i)
      if (filter === 'alertes' ? level === 'ok' : filter !== 'tous' && level !== filter) return false
      return !q || i.name.toLowerCase().includes(q)
    })
  }, [items, query, filter])

  // Par défaut, les 4 premiers articles (comme sur la maquette) ; une recherche ou un filtre affiche tout.
  const PREVIEW = 4
  const narrowed = filter !== 'tous' || query.trim() !== ''
  const shown = showAll || narrowed ? visible : visible.slice(0, PREVIEW)

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'tous', label: 'Tous', count: items.length },
    { id: 'alertes', label: 'Alertes', count: summary.low },
    { id: 'ok', label: 'En stock', count: counts.ok },
    { id: 'faible', label: 'Stock faible', count: counts.faible },
    { id: 'critique', label: 'Critique', count: counts.critique },
  ]

  const close = () => setDialog(null)

  return (
    <>
      {/* En-tête : marque + recherche / filtre (la marque est déjà dans le menu latéral sur grand écran) */}
      <div className="flex items-center gap-3 border-b border-border pb-3 lg:border-0 lg:pb-0">
        <div className="flex min-w-0 items-center gap-3 text-gold lg:hidden">
          <BrandMark className="size-10 shrink-0 max-[359px]:hidden" />
          <span className="min-w-0">
            <span className="block truncate font-serif text-[0.8rem] font-medium uppercase tracking-[0.14em] text-foreground max-[359px]:text-[0.72rem] max-[359px]:tracking-[0.08em] min-[380px]:text-[0.9rem] sm:text-lg sm:tracking-[0.2em]">RestoBen Manager</span>
            <span className="block truncate text-xs text-foreground/80 sm:text-sm">Gestion des stocks avancée</span>
          </span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => setSearchOpen((o) => !o)} aria-label="Rechercher un article" aria-pressed={searchOpen} className="inline-flex size-11 items-center justify-center rounded-full text-foreground hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 aria-pressed:text-ember">
            <Search className="size-6" strokeWidth={1.6} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setFilterOpen((o) => !o)} aria-label="Filtrer les articles" aria-pressed={filterOpen || filter !== 'tous'} className="inline-flex size-11 items-center justify-center rounded-full text-foreground hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 aria-pressed:text-ember">
            <Filter className="size-6" strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
      </div>

      <h1 className="mt-4 font-serif text-5xl font-semibold leading-none text-foreground lg:mt-0">Stocks</h1>

      {searchOpen && (
        <div className="mt-4">
          <label htmlFor="stock-search" className="sr-only">Rechercher un article</label>
          <input ref={searchRef} id="stock-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom de l’article…" className={fieldClass} />
        </div>
      )}

      {filterOpen && (
        <div role="group" aria-label="Filtrer par niveau" className="mt-4 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                'h-9 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30',
                filter === f.id ? 'border-ember bg-ember text-primary-foreground' : 'border-border bg-card hover:border-ember',
              )}
            >
              {f.label} <span className="tabular-nums opacity-80">({f.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Trois indicateurs */}
      <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-4">
        <section aria-label="Niveau actuel" className={cn(card, 'flex min-w-0 flex-col items-center p-3 text-center sm:p-4')}>
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-sand text-espresso sm:size-12">
            <Box className="size-5 sm:size-6" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <span className="mt-2 text-xs font-medium text-foreground sm:text-sm">Niveau actuel</span>
          <span className="mt-1 font-serif text-3xl font-semibold leading-none tabular-nums sm:text-5xl">{summary.count}</span>
          <span className="mt-1 text-xs text-foreground/85 sm:text-sm">articles</span>
        </section>

        <button
          type="button"
          onClick={() => {
            setFilter('alertes')
            setFilterOpen(true)
          }}
          aria-label={`Stock faible : ${summary.low} articles, afficher les alertes`}
          className={cn(card, 'flex min-w-0 flex-col items-center border-ember/25 bg-gradient-to-b from-[#fdebdd] to-card p-3 text-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/35 sm:p-4')}
        >
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-ember-deep text-primary-foreground sm:size-12">
            <TriangleAlert className="size-5 sm:size-6" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="mt-2 text-xs font-medium text-foreground sm:text-sm">Stock faible</span>
          <span className="mt-1 font-serif text-3xl font-semibold leading-none tabular-nums text-ember-deep sm:text-5xl">{summary.low}</span>
          <span className="mt-1 text-xs text-foreground/85 sm:text-sm">articles</span>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-ember/12 px-2 py-0.5 text-[11px] font-medium text-ember-deep sm:text-xs">
            <TriangleAlert className="size-3" aria-hidden="true" />
            Alertes
          </span>
        </button>

        <section aria-label="Valeur totale" className={cn(card, 'flex min-w-0 flex-col items-center p-3 text-center sm:p-4')}>
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f3d27a] to-[#c98f1f] text-white shadow-inner sm:size-12">
            <CircleDollarSign className="size-5 sm:size-6" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="mt-2 text-xs font-medium text-foreground sm:text-sm">Valeur totale</span>
          <span className="mt-1 whitespace-nowrap font-serif text-[1.05rem] font-semibold leading-tight tabular-nums min-[380px]:text-[1.3rem] sm:text-3xl">
            {num(summary.value)}
          </span>
          <span className="mt-1 text-xs text-foreground/85 sm:text-sm">FCFA</span>
        </section>
      </div>

      {/* Articles */}
      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground min-[360px]:text-xs min-[360px]:tracking-[0.18em]">Articles en stock</h2>
          <span className="mt-1.5 block h-0.5 w-8 bg-gold" aria-hidden="true" />
        </div>
        <button type="button" onClick={() => setDialog({ type: 'item', item: null })} className="inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-sm font-semibold text-ember-deep hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
          <Plus className="size-4" aria-hidden="true" />
          Nouvel article
        </button>
      </div>

      {visible.length === 0 ? (
        <p className={cn(card, 'mt-3 p-5 text-center text-sm text-muted-foreground')}>
          {items.length === 0 ? 'Aucun article pour le moment. Ajoutez votre premier article.' : 'Aucun article ne correspond à votre recherche.'}
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2.5 lg:grid-cols-2">
          {shown.map((i) => {
            const level = levelOf(i)
            const up = i.trend >= 0
            return (
              <li key={i.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setDialog({ type: 'item', item: i })}
                  aria-label={`${i.name}, ${formatQty(i.qty)} ${i.unit}, ${levelStyle[level].label}. Modifier`}
                  className={cn(card, 'flex w-full min-w-0 items-center gap-3 p-2 pr-3 text-left transition-colors hover:border-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30')}
                >
                  <Thumb item={i} className="size-[4.25rem] rounded-xl sm:size-[4.75rem]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium leading-tight text-foreground">{i.name}</span>
                    <span className="mt-0.5 block font-serif text-2xl font-medium leading-tight tabular-nums">
                      {formatQty(i.qty)} <span className="text-lg">{i.unit}</span>
                    </span>
                    <span className="block text-xs text-foreground/85">
                      Seuil {formatQty(i.threshold)} {i.unit}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-4">
                    <span className={cn('inline-flex items-center gap-1 text-sm font-medium tabular-nums', up ? 'text-success' : 'text-ember-deep')}>
                      {up ? <ArrowUp className="size-4" strokeWidth={2} aria-hidden="true" /> : <ArrowDownRight className="size-4" strokeWidth={2} aria-hidden="true" />}
                      <span className="text-foreground">{Math.abs(i.trend)}%</span>
                      <span className="sr-only">{up ? 'en hausse' : 'en baisse'}</span>
                    </span>
                    <LevelPill level={level} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {!narrowed && visible.length > PREVIEW && (
        <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className="mx-auto mt-3 flex h-10 items-center rounded-lg px-3 text-sm font-semibold text-ember-deep hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
          {showAll ? 'Réduire la liste' : `Voir tous les articles (${visible.length})`}
        </button>
      )}

      <div className="mt-4 grid gap-3 lg:max-w-xl">
        <button type="button" onClick={() => setDialog({ type: 'movement' })} className={cn(primary, 'h-14')}>
          <Plus className="size-6" strokeWidth={1.8} aria-hidden="true" />
          Ajouter un mouvement
        </button>
        <button
          type="button"
          onClick={() => setDialog({ type: 'history' })}
          className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-gold/60 bg-card text-base font-medium text-foreground transition-colors hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
        >
          <Clock className="size-5 text-[#9a6f2e]" strokeWidth={1.6} aria-hidden="true" />
          Voir l’historique
        </button>
      </div>

      {/* Pied : alertes + signature */}
      <div className={cn(card, 'mt-4 flex items-stretch rounded-2xl p-1.5 lg:max-w-xl')}>
        <button
          type="button"
          onClick={() => {
            setFilter('critique')
            setFilterOpen(true)
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-base font-medium hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
        >
          <Bell className="size-6" strokeWidth={1.6} aria-hidden="true" />
          <span>
            Alertes <span className="text-ember-deep">({summary.critical})</span>
          </span>
        </button>
        <span className="my-2 w-px bg-border" aria-hidden="true" />
        <div className="flex flex-1 items-center justify-center gap-2.5 px-3 py-3">
          <ShieldCheck className="size-9 shrink-0 text-gold" strokeWidth={1.4} aria-hidden="true" />
          <span className="min-w-0 leading-tight">
            <span className="block font-serif text-lg font-semibold">RestoBen</span>
            <span className="block text-[10px] text-foreground/80 min-[380px]:text-xs">Bénin • Qualité • Confiance</span>
          </span>
        </div>
      </div>

      {dialog?.type === 'movement' && <MovementDialog items={items} initialItemId={dialog.itemId} onClose={close} />}
      {dialog?.type === 'history' && <HistoryDialog movements={movements} onClose={close} />}
      {dialog?.type === 'item' && (
        <ItemDialog item={dialog.item} items={items} onClose={close} onMovement={(id) => setDialog({ type: 'movement', itemId: id })} />
      )}
    </>
  )
}
