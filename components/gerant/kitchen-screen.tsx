'use client'

import { useEffect, useRef, useState } from 'react'
import { ChefHat, Clock, Flame, PackageCheck, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/gerant-data'
import { tableLabel, type StoreOrder } from '@/lib/orders-store'
import type { MenuDish } from '@/lib/menu-store'
import { playDing, unlockAudio } from '@/lib/kitchen-sound'
import { useNow } from '@/lib/use-now'
import { Panel, ScreenHeader } from './shared'

const SOUND_KEY = 'restoben:kitchen-sound'

const columns: { status: OrderStatus; title: string; empty: string; action?: { label: string; to: OrderStatus }; icon: typeof Flame; tone: string }[] = [
  { status: 'en_attente', title: 'À préparer', empty: 'Aucune nouvelle commande.', action: { label: 'Démarrer la préparation', to: 'en_cours' }, icon: Clock, tone: 'bg-gold/20 text-[#8a5a12]' },
  { status: 'en_cours', title: 'En préparation', empty: 'Rien en cours.', action: { label: 'Marquer prête', to: 'pret' }, icon: Flame, tone: 'bg-ember/12 text-ember-deep' },
  { status: 'pret', title: 'Prêtes à servir', empty: 'Aucune commande prête.', action: { label: 'Servie à table', to: 'terminee' }, icon: PackageCheck, tone: 'bg-success/15 text-success' },
]

function minutes(ms: number) {
  return Math.max(0, Math.floor(ms / 60_000))
}

export function KitchenScreen({
  orders,
  dishes,
  onUpdate,
  onToggleDish,
}: {
  orders: StoreOrder[]
  dishes: MenuDish[]
  onUpdate: (id: string, status: OrderStatus) => void
  onToggleDish: (id: string) => void
}) {
  const now = useNow(30_000)
  const [sound, setSound] = useState(true)
  const [blocked, setBlocked] = useState(false)
  // Seules les commandes arrivées après l'ouverture de l'écran déclenchent le son.
  const openedAt = useRef(Date.now())
  const announced = useRef(new Set<string>())

  // Retrouve le choix « son coupé » d'une fois sur l'autre.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SOUND_KEY) === 'off') setSound(false)
    } catch {
      /* stockage indisponible */
    }
  }, [])

  // Le premier toucher de l'écran débloque le son (sinon le navigateur le bloque).
  useEffect(() => {
    const unlock = async () => {
      if (await unlockAudio()) setBlocked(false)
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // Son quand une nouvelle commande arrive en cuisine.
  useEffect(() => {
    const fresh = orders.filter((o) => o.status === 'en_attente' && o.createdAt >= openedAt.current && !announced.current.has(o.id))
    if (fresh.length === 0) return
    fresh.forEach((o) => announced.current.add(o.id))
    if (sound) void playDing().then((ok) => setBlocked(!ok))
  }, [orders, sound])

  async function toggleSound() {
    const next = !sound
    setSound(next)
    try {
      window.localStorage.setItem(SOUND_KEY, next ? 'on' : 'off')
    } catch {
      /* stockage indisponible */
    }
    // On joue un bip de test : on entend tout de suite que le son marche.
    setBlocked(next ? !(await playDing()) : false)
  }

  return (
    <>
      <ScreenHeader
        title="Cuisine"
        subtitle="Les commandes arrivent ici dès que le client les passe."
        actions={
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? 'Désactiver le son des nouvelles commandes' : 'Activer le son des nouvelles commandes'}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium hover:border-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
          >
            {sound ? <Volume2 className="size-4 text-ember" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
            {sound ? 'Son activé' : 'Son coupé'}
          </button>
        }
      />

      {sound && blocked && (
        <p role="status" className="mb-4 rounded-xl bg-gold/15 p-3 text-sm text-[#6b4510]">
          Le navigateur bloque le son. Touchez l’écran ou le bouton « Son activé » pour l’autoriser.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
        {columns.map((col) => {
          const list = orders.filter((o) => o.status === col.status).sort((a, b) => a.createdAt - b.createdAt)
          const Icon = col.icon
          return (
            <section key={col.status} aria-labelledby={`k-${col.status}`} className="flex flex-col gap-3">
              <h2 id={`k-${col.status}`} className="flex items-center gap-2 font-serif text-xl font-semibold">
                <span className={cn('inline-flex size-8 items-center justify-center rounded-lg', col.tone)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {col.title}
                <span className="rounded-full bg-muted px-2 text-sm font-semibold leading-6">{list.length}</span>
              </h2>

              {list.length === 0 && <Panel className="py-8 text-center text-sm text-muted-foreground">{col.empty}</Panel>}

              {list.map((o) => {
                const since = col.status === 'pret' ? (o.times.pret ?? o.createdAt) : o.createdAt
                const wait = minutes(now - since)
                const late = col.status !== 'pret' && wait >= 20
                const warn = col.status !== 'pret' && wait >= 10
                return (
                  <Panel key={o.id} className={cn('flex flex-col gap-3', late && 'border-destructive/60 ring-2 ring-destructive/15')}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-serif text-2xl font-semibold leading-tight">{tableLabel(o.table)}</p>
                        <p className="text-xs text-muted-foreground">
                          Commande #{o.number}
                          {o.source === 'comptoir' && ' · comptoir'}
                        </p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums', late ? 'bg-destructive/12 text-destructive' : warn ? 'bg-gold/20 text-[#8a5a12]' : 'bg-muted text-muted-foreground')}>
                        <Clock className="size-3" aria-hidden="true" />
                        {col.status === 'pret' ? `prête depuis ${wait} min` : `${wait} min`}
                      </span>
                    </div>

                    <ul className="flex flex-col gap-1.5 border-y border-dashed border-border py-3">
                      {o.lines.map((l) => (
                        <li key={l.id} className="flex items-baseline gap-3 text-base">
                          <span className="min-w-8 font-serif text-xl font-semibold tabular-nums text-ember-deep">{l.qty}×</span>
                          <span className="font-medium">{l.name}</span>
                        </li>
                      ))}
                    </ul>

                    {col.action && (
                      <button
                        type="button"
                        onClick={() => onUpdate(o.id, col.action!.to)}
                        className="inline-flex h-12 items-center justify-center rounded-xl bg-ember px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-ember/20 transition-colors hover:bg-ember-deep focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/35"
                      >
                        {col.action.label}
                      </button>
                    )}
                  </Panel>
                )
              })}
            </section>
          )
        })}
      </div>

      <Panel className="mt-8">
        <div className="flex items-center gap-2">
          <ChefHat className="size-5 text-ember" aria-hidden="true" />
          <h2 className="font-serif text-xl font-semibold">Ruptures</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Plus de stock ? Retirez le plat : il devient indisponible tout de suite dans le menu des clients.</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {dishes.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                aria-pressed={!d.available}
                onClick={() => onToggleDish(d.id)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30',
                  d.available ? 'border-border bg-card hover:border-ember' : 'border-destructive/50 bg-destructive/10 text-destructive',
                )}
              >
                {d.name}
                {!d.available && <span className="text-xs font-semibold uppercase tracking-wide">rupture</span>}
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}
