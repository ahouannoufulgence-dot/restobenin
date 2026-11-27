'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, ImagePlus, Plus, Search, Trash2, UtensilsCrossed, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fcfa } from '@/lib/gerant-data'
import { categories, type Category } from '@/lib/client-data'
import { photoToDataUrl } from '@/lib/image-resize'
import type { MenuDish, MenuVariant } from '@/lib/menu-store'
import { Panel, ScreenHeader, primaryAction } from './shared'

const fieldClass =
  'h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ember focus:ring-3 focus:ring-ember/20'

const dishCategories = categories.filter((c): c is { id: Category; label: string } => c.id !== 'tous')

/** Une taille en cours de saisie : `id` vient de la base (absent pour une nouvelle taille). */
type DraftVariant = { key: string; id?: string; name: string; price: string; image?: string }

type Draft = {
  id: string | null
  name: string
  price: string
  description: string
  category: Category
  image?: string
  variants: DraftVariant[]
}

const emptyDraft: Draft = { id: null, name: '', price: '', description: '', category: 'plats', variants: [] }

/** Tailles d'un plat (petit, grand…) : chacune a son prix. Sans taille, le plat garde son prix de base. */
function VariantsEditor({ draft, setDraft }: { draft: Draft; setDraft: (update: (d: Draft) => Draft) => void }) {
  const update = (key: string, patch: Partial<DraftVariant>) =>
    setDraft((d) => ({ ...d, variants: d.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) }))
  const [busyKey, setBusyKey] = useState<string | null>(null)
  async function pickPhoto(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusyKey(key)
    try {
      update(key, { image: await photoToDataUrl(file) })
    } catch {
      /* photo refusée : la taille garde sa photo précédente */
    } finally {
      setBusyKey(null)
    }
  }
  const add = () =>
    setDraft((d) => ({ ...d, variants: [...d.variants, { key: `new-${Date.now().toString(36)}${d.variants.length}`, name: '', price: '' }] }))
  const remove = (key: string) => setDraft((d) => ({ ...d, variants: d.variants.filter((v) => v.key !== key) }))

  return (
    <fieldset className="rounded-xl border border-border p-3">
      <legend className="px-1 text-sm font-medium">Tailles et prix</legend>
      <p className="mb-3 text-xs text-muted-foreground">
        Pour un plat qui existe en plusieurs formats (petit, grand, 1 000 ou 1 500). Le client choisit la taille. Laissez vide si le plat n’a qu’un seul prix.
      </p>
      {draft.variants.length === 0 && (
        <p className="mb-3 text-xs text-muted-foreground">Aucune taille : le plat se vend à son prix de base.</p>
      )}
      <ul className="grid gap-2">
        {draft.variants.map((v, i) => (
          <li key={v.key} className="grid grid-cols-[1fr_7rem_auto] items-center gap-2">
            <label htmlFor={`variant-name-${v.key}`} className="sr-only">Nom de la taille {i + 1}</label>
            <input
              id={`variant-name-${v.key}`}
              value={v.name}
              onChange={(e) => update(v.key, { name: e.target.value })}
              placeholder="Ex. Petit"
              maxLength={40}
              className={fieldClass}
            />
            <label htmlFor={`variant-price-${v.key}`} className="sr-only">Prix de la taille {v.name || i + 1} en FCFA</label>
            <input
              id={`variant-price-${v.key}`}
              inputMode="numeric"
              value={v.price}
              onChange={(e) => update(v.key, { price: e.target.value.replace(/\D/g, '') })}
              placeholder="1000"
              className={fieldClass}
            />
            <div className="col-span-3 flex items-center gap-3">
              {v.image ? (
                <img src={v.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="size-12 shrink-0 rounded-lg bg-sand" aria-hidden="true" />
              )}
              <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-border px-3 text-xs font-semibold hover:border-ember hover:text-ember focus-within:ring-3 focus-within:ring-ember/30">
                {busyKey === v.key ? 'Chargement…' : v.image ? 'Changer la photo' : 'Ajouter une photo'}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => void pickPhoto(v.key, e)} disabled={busyKey === v.key} />
              </label>
              {v.image && (
                <button type="button" onClick={() => update(v.key, { image: undefined })} className="text-xs font-semibold text-destructive hover:underline">
                  Retirer
                </button>
              )}
              <span className="text-xs text-muted-foreground">Facultative : sans photo, la taille reprend celle du plat.</span>
            </div>
            <button
              type="button"
              onClick={() => remove(v.key)}
              aria-label={`Retirer la taille ${v.name || i + 1}`}
              className="inline-flex size-10 items-center justify-center rounded-xl text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/30"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="mt-3 inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
      >
        + Ajouter une taille
      </button>
    </fieldset>
  )
}

function DishForm({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial: Draft
  onSave: (draft: Draft) => string | null
  onDelete?: () => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const editing = initial.id !== null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const image = await photoToDataUrl(file)
      setDraft((d) => ({ ...d, image }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger cette photo.')
    } finally {
      setBusy(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const message = onSave(draft)
    if (message) setError(message)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="dish-form-title">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300 md:rounded-3xl md:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 id="dish-form-title" className="font-serif text-2xl font-semibold">
            {editing ? 'Modifier le plat' : 'Ajouter un plat'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="inline-flex size-9 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Photo du plat</p>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-dashed border-border bg-muted">
              {draft.image ? (
                <Image src={draft.image} alt="Aperçu de la photo du plat" fill sizes="(min-width: 768px) 448px, 100vw" unoptimized={!draft.image.startsWith('/')} className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImagePlus className="size-9" strokeWidth={1.5} aria-hidden="true" />
                  <p className="text-sm">Aucune photo pour l’instant</p>
                </div>
              )}
            </div>
            <input ref={fileRef} id="dish-photo" type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 disabled:opacity-50"
              >
                <Camera className="size-4" aria-hidden="true" />
                {busy ? 'Chargement…' : draft.image ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
              {draft.image && (
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, image: undefined }))}
                  className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/30"
                >
                  Retirer la photo
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="dish-name" className="mb-1 block text-sm font-medium">
              Nom du plat
            </label>
            <input id="dish-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ex. Amiwo au poulet" className={fieldClass} />
          </div>

          <VariantsEditor draft={draft} setDraft={setDraft} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dish-price" className="mb-1 block text-sm font-medium">
                {draft.variants.length > 0 ? 'Prix de base (si pas de taille)' : 'Prix (FCFA)'}
              </label>
              <input
                id="dish-price"
                inputMode="numeric"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D/g, '') })}
                placeholder="3000"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="dish-category" className="mb-1 block text-sm font-medium">
                Catégorie
              </label>
              <select id="dish-category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })} className={fieldClass}>
                {dishCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dish-description" className="mb-1 block text-sm font-medium">
              Description (facultatif)
            </label>
            <textarea
              id="dish-description"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              placeholder="Ingrédients, accompagnement…"
              className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ember focus:ring-3 focus:ring-ember/20"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button type="submit" disabled={busy} className={cn(primaryAction, 'w-full disabled:opacity-50')}>
              {editing ? 'Enregistrer les modifications' : 'Ajouter au menu'}
            </button>
            {editing &&
              onDelete &&
              (confirmDelete ? (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm">
                  <span className="flex-1 font-medium text-destructive">Supprimer ce plat du menu ?</span>
                  <button type="button" onClick={onDelete} className="h-9 rounded-lg bg-destructive px-3 font-semibold text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/40">
                    Supprimer
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="h-9 rounded-lg px-3 font-semibold hover:bg-muted">
                    Garder
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/30"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Supprimer ce plat
                </button>
              ))}
          </div>
        </form>
      </div>
    </div>
  )
}

export function MenuScreen({
  dishes,
  onToggle,
  onSave,
  onRemove,
  newId,
  canEdit = true,
}: {
  dishes: MenuDish[]
  onToggle: (id: string) => void
  onSave: (dish: MenuDish) => boolean
  onRemove: (id: string) => void
  newId: () => string
  /** false : consultation seule (pas d'ajout, de modification, de suppression ni de changement de disponibilité). */
  canEdit?: boolean
}) {
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<Draft | null>(null)

  const visible = dishes.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()))

  function save(draft: Draft): string | null {
    const filled = draft.variants.filter((v) => v.name.trim() || v.price.trim())
    const variants: MenuVariant[] = []
    const seen = new Set<string>()
    for (const v of filled) {
      const price = Number(v.price)
      if (!v.name.trim()) return 'Donnez un nom à chaque taille (Petit, Grand…).'
      if (!Number.isInteger(price) || price <= 0) return `Indiquez un prix valide pour la taille « ${v.name.trim()} ».`
      const key = v.name.trim().toLowerCase()
      if (seen.has(key)) return `La taille « ${v.name.trim()} » est en double.`
      seen.add(key)
      variants.push({ id: v.id ?? '', name: v.name.trim(), price, available: true, image: v.image })
    }
    // Avec des tailles, le prix de base devient celui de la première taille (et n'est plus demandé).
    const value = variants.length > 0 ? variants[0].price : Number(draft.price)
    if (!draft.name.trim()) return 'Indiquez le nom du plat.'
    if (!Number.isInteger(value) || value <= 0) return 'Indiquez un prix valide en FCFA.'
    const existing = draft.id ? dishes.find((d) => d.id === draft.id) : undefined
    const ok = onSave({
      id: draft.id ?? newId(),
      name: draft.name.trim(),
      price: value,
      description: draft.description.trim(),
      category: draft.category,
      image: draft.image,
      available: existing?.available ?? true,
      // Identifiant unique au format UUID, exigé par la base (l'ancien format « v-… » était refusé).
      variants: variants.map((v) => ({ ...v, id: v.id || crypto.randomUUID() })),
    })
    if (!ok) return 'Enregistrement impossible : la mémoire du navigateur est pleine. Retirez une photo ou choisissez une image plus légère.'
    setForm(null)
    return null
  }

  return (
    <>
      <ScreenHeader title="Menu" subtitle={`${dishes.filter((d) => d.available).length} plats disponibles sur ${dishes.length}`} />

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="dish-search" className="sr-only">
          Rechercher un plat
        </label>
        <input id="dish-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un plat" className={cn(fieldClass, 'bg-card pl-10')} />
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {visible.map((dish) => (
          <li key={dish.id}>
            <Panel className="flex items-center gap-3 p-3 sm:p-3">
              <button
                type="button"
                onClick={() => setForm({ id: dish.id, name: dish.name, price: String(dish.price), description: dish.description, category: dish.category, image: dish.image, variants: (dish.variants ?? []).map((v) => ({ key: v.id, id: v.id, name: v.name, price: String(v.price), image: v.image })) })}
                disabled={!canEdit}
                aria-label={canEdit ? `Modifier ${dish.name}` : dish.name}
                className="flex min-w-0 flex-1 items-center gap-4 rounded-xl text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 disabled:cursor-default"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {dish.image ? (
                    <Image src={dish.image} alt="" fill sizes="64px" unoptimized={!dish.image.startsWith('/')} className="object-cover" />
                  ) : (
                    <UtensilsCrossed className="absolute inset-0 m-auto size-6 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{dish.name}</p>
                  <p className="text-sm tabular-nums text-foreground/80">{fcfa(dish.price)}</p>
                  <p className="flex items-center gap-2 text-xs font-medium">
                    <span className={dish.available ? 'text-success' : 'text-muted-foreground'}>{dish.available ? 'Disponible' : 'Indisponible'}</span>
                    {canEdit && !dish.image && (
                      <span className="inline-flex items-center gap-1 text-ember-deep">
                        <Camera className="size-3" aria-hidden="true" />
                        Ajouter une photo
                      </span>
                    )}
                  </p>
                </div>
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={dish.available}
                aria-label={`Disponibilité de ${dish.name}`}
                onClick={() => onToggle(dish.id)}
                disabled={!canEdit}
                className={cn(
                  'relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 disabled:cursor-not-allowed disabled:opacity-60',
                  dish.available ? 'bg-success' : 'bg-foreground/20',
                )}
              >
                <span className={cn('absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform', dish.available && 'translate-x-5')} />
              </button>
            </Panel>
          </li>
        ))}
      </ul>

      {visible.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Aucun plat ne correspond à votre recherche.</p>}

      {canEdit && (
      <div className="mt-8 flex justify-center">
        <button type="button" onClick={() => setForm(emptyDraft)} className={cn(primaryAction, 'w-full sm:w-auto')}>
          <Plus className="size-4" aria-hidden="true" />
          Ajouter un plat
        </button>
      </div>
      )}

      {form && (
        <DishForm
          key={form.id ?? 'new'}
          initial={form}
          onSave={save}
          onDelete={form.id ? () => {
            onRemove(form.id as string)
            setForm(null)
          } : undefined}
          onClose={() => setForm(null)}
        />
      )}
    </>
  )
}
