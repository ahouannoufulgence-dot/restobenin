import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Category, ClientDish, OrderLine, PlacedOrder } from './client-data'
import { stageOf } from './orders-store'
import type { OrderStatus } from './gerant-data'
import { publicUrl } from './supabase/api'
import { getSupabase } from './supabase/client'
import { friendlyError } from './supabase/runtime'

/**
 * Espace client branché sur la base (accès sans compte, depuis le QR code d'une table).
 * Le client ne lit rien directement dans les tables : il passe par quatre fonctions publiques de la base
 * (menu du restaurant, envoi de la commande, suivi et avis), le suivi et l'avis se faisant avec un jeton
 * secret propre à sa commande.
 */
export type ClientStatus = 'idle' | 'loading' | 'ready' | 'notfound' | 'error'

type MenuState = { name: string; isOpen: boolean; serviceFee: number; dishes: ClientDish[] }

type Tracked = {
  number: number
  status: OrderStatus
  subtotal: number
  total: number
  createdAt: number
  inProgressAt?: number
  readyAt?: number
  completedAt?: number
  lines: { name: string; qty: number; price: number }[]
  reviewed: boolean
}

type PlaceResult = { ok: true } | { ok: false; error: string }

const MENU_REFRESH_MS = 30_000
const TRACK_REFRESH_MS = 5_000
const stamp = (v: unknown) => (typeof v === 'string' ? Date.parse(v) : undefined)
const isFinal = (s: OrderStatus) => s === 'terminee' || s === 'annulee'

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapMenu(raw: any): MenuState {
  const items = (Array.isArray(raw.items) ? raw.items : []) as any[]
  return {
    name: String(raw.name ?? ''),
    isOpen: raw.is_open !== false,
    serviceFee: Number(raw.service_fee ?? 0),
    dishes: items.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? '',
      price: m.price,
      category: m.category as Category,
      image: publicUrl(m.image_path),
      available: !!m.available,
      rating: 0,
      reviewCount: 0,
      reviews: [],
    })),
  }
}

function mapTracked(raw: any): Tracked {
  return {
    number: raw.number,
    status: raw.status,
    subtotal: raw.subtotal,
    total: raw.total,
    createdAt: Date.parse(raw.created_at),
    inProgressAt: stamp(raw.in_progress_at),
    readyAt: stamp(raw.ready_at),
    completedAt: stamp(raw.completed_at),
    lines: ((raw.lines ?? []) as any[]).map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
    reviewed: !!raw.reviewed,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Sans `slug` (mode démonstration), ne fait rien. */
export function useRemoteClient(slug: string | undefined, table: string) {
  const [status, setStatus] = useState<ClientStatus>(slug ? 'loading' : 'idle')
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [tracked, setTracked] = useState<Tracked | null>(null)
  const tokenKey = `restoben:client-order:${slug}:${table}`

  // Menu du restaurant, relu régulièrement (plat devenu indisponible, restaurant fermé…).
  useEffect(() => {
    if (!slug) return
    let off = false
    const load = async () => {
      try {
        const { data, error } = await getSupabase().rpc('public_menu', { p_slug: slug })
        if (off) return
        if (error) throw new Error(error.message)
        if (!data) return setStatus('notfound')
        setMenu(mapMenu(data))
        setStatus('ready')
      } catch {
        if (!off) setStatus((s) => (s === 'ready' ? s : 'error')) // une relecture qui échoue ne casse pas un menu déjà affiché
      }
    }
    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, MENU_REFRESH_MS)
    return () => {
      off = true
      window.clearInterval(timer)
    }
  }, [slug])

  // Retrouve la commande en cours si le client recharge la page.
  useEffect(() => {
    if (!slug) return
    try {
      const saved = window.sessionStorage.getItem(tokenKey)
      if (saved) setToken(saved)
    } catch {
      /* stockage indisponible */
    }
  }, [slug, tokenKey])

  // Suivi : relu toutes les 5 secondes tant que la commande n'est pas terminée ou annulée.
  useEffect(() => {
    if (!slug || !token) return
    let off = false
    let timer: number | undefined
    const poll = async () => {
      try {
        const { data, error } = await getSupabase().rpc('track_order', { p_token: token })
        if (off || error) return
        if (!data) {
          setToken(null)
          setTracked(null)
          return
        }
        const next = mapTracked(data)
        setTracked(next)
        if (isFinal(next.status)) return
      } catch {
        /* connexion coupée : on réessaie */
      }
      if (!off) timer = window.setTimeout(poll, TRACK_REFRESH_MS)
    }
    void poll()
    return () => {
      off = true
      window.clearTimeout(timer)
    }
  }, [slug, token])

  const place = useCallback(
    async (lines: OrderLine[]): Promise<PlaceResult> => {
      const number = Number.parseInt(table, 10)
      if (!slug || !Number.isInteger(number)) return { ok: false, error: 'Table invalide : scannez de nouveau le QR code de votre table.' }
      try {
        const { data, error } = await getSupabase().rpc('place_client_order', {
          p_slug: slug,
          p_table: number,
          p_lines: lines.map((l) => ({ id: l.id, qty: l.qty })),
        })
        if (error || !data) return { ok: false, error: friendlyError(error?.message) }
        const res = data as { number: number; total: number; guest_token: string }
        try {
          window.sessionStorage.setItem(tokenKey, res.guest_token)
        } catch {
          /* stockage indisponible */
        }
        // Affichage immédiat de la confirmation ; le suivi prend le relais.
        setTracked({
          number: res.number,
          status: 'en_attente',
          subtotal: lines.reduce((s, l) => s + l.price * l.qty, 0),
          total: res.total,
          createdAt: Date.now(),
          lines: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
          reviewed: false,
        })
        setToken(res.guest_token)
        return { ok: true }
      } catch (e) {
        return { ok: false, error: friendlyError(e instanceof Error ? e.message : String(e)) }
      }
    },
    [slug, table, tokenKey],
  )

  /** Renvoie un message d'erreur à afficher, ou rien si l'avis est enregistré. */
  const submitReview = useCallback(
    async (rating: number, comment: string): Promise<string | void> => {
      if (!token) return 'Commande introuvable.'
      try {
        const { error } = await getSupabase().rpc('submit_review', { p_token: token, p_rating: rating, p_comment: comment.trim() })
        if (error) return friendlyError(error.message)
        setTracked((t) => (t ? { ...t, reviewed: true } : t))
      } catch (e) {
        return friendlyError(e instanceof Error ? e.message : String(e))
      }
    },
    [token],
  )

  const order: PlacedOrder | null = useMemo(
    () =>
      tracked
        ? {
            number: String(tracked.number).padStart(4, '0'),
            lines: tracked.lines.map((l) => ({ id: '', name: l.name, qty: l.qty, price: l.price })),
            subtotal: tracked.subtotal,
            total: tracked.total,
            stage: stageOf[tracked.status],
            times: [tracked.createdAt, tracked.inProgressAt, tracked.readyAt, tracked.completedAt].filter((t): t is number => typeof t === 'number'),
            cancelled: tracked.status === 'annulee',
          }
        : null,
    [tracked],
  )

  return {
    status,
    name: menu?.name ?? '',
    isOpen: menu?.isOpen ?? true,
    serviceFee: menu?.serviceFee ?? 0,
    dishes: menu?.dishes ?? [],
    order,
    orderActive: !!tracked && !isFinal(tracked.status),
    place,
    submitReview,
  }
}
