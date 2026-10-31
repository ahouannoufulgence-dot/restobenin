'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Category, PlacedOrder } from '@/lib/client-data'
import { useRemoteClient } from '@/lib/client-remote'
import { useClientDishes } from '@/lib/menu-store'
import { ordersActions, stageOf, useOrders } from '@/lib/orders-store'
import { useSettings } from '@/lib/settings-store'
import { BottomNav, TopNav, type ClientTab } from './bottom-nav'
import { CartPanel, CartScreen } from './cart-screen'
import { ConfirmedScreen } from './confirmed-screen'
import { DishScreen } from './dish-screen'
import { MenuScreen } from './menu-screen'
import { ReviewSheet } from './review-sheet'
import { TrackingScreen } from './tracking-screen'
import { WelcomeScreen } from './welcome-screen'

type View = 'accueil' | 'menu' | 'plat' | 'panier' | 'confirmee' | 'suivi'

const ORDER_KEY = 'restoben:client-order'

/** `slug` : mode base de données (restaurant désigné par le QR code). `needsQr` : le lien ne désigne ni restaurant ni table. */
export function ClientApp({ table, slug, needsQr = false }: { table: string; slug?: string; needsQr?: boolean }) {
  const [view, setView] = useState<View>('accueil')
  const [category, setCategory] = useState<Category | 'tous'>('tous')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const remote = useRemoteClient(slug, table)
  const localDishes = useClientDishes()
  const { restaurantName: localName } = useSettings()
  const dishes = slug ? remote.dishes : localDishes
  const restaurantName = slug ? remote.name : localName
  const [placing, setPlacing] = useState(false)
  const [rawCart, setCart] = useState<Record<string, number>>({})
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderError, setOrderError] = useState('')
  const orders = useOrders()
  const [reviewOpen, setReviewOpen] = useState(false)

  // Si le gérant retire un plat ou le rend indisponible, il disparaît aussi du panier.
  const cart = useMemo(() => Object.fromEntries(Object.entries(rawCart).filter(([id]) => dishes.some((d) => d.id === id && d.available))), [rawCart, dishes])

  // Le suivi vient des vrais statuts de la commande, mis à jour par la cuisine et la caisse.
  const stored = orderId ? orders.find((o) => o.id === orderId) : undefined
  const localOrder: PlacedOrder | null = stored
    ? {
        number: stored.number,
        lines: stored.lines,
        subtotal: stored.subtotal,
        total: stored.total,
        stage: stageOf[stored.status],
        times: [stored.createdAt, stored.times.en_cours, stored.times.pret, stored.times.terminee].filter((t): t is number => typeof t === 'number'),
        cancelled: stored.status === 'annulee',
      }
    : null
  const localActive = !!stored && stored.status !== 'terminee' && stored.status !== 'annulee'
  const order = slug ? remote.order : localOrder
  const orderActive = slug ? remote.orderActive : localActive

  // Retrouve la commande en cours si le client recharge la page.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(`${ORDER_KEY}:${table}`)
      if (saved) setOrderId(saved)
    } catch {
      /* stockage indisponible */
    }
  }, [table])

  // L'avis du client est enregistré sur sa commande : il alimente la satisfaction des rapports.
  const submitReview = (rating: number, comment: string) => {
    if (slug) return remote.submitReview(rating, comment)
    if (orderId) ordersActions.review(orderId, rating, comment)
  }

  function go(next: View) {
    setView(next)
    window.scrollTo({ top: 0 })
  }

  function setQty(id: string, qty: number) {
    setCart((c) => {
      const next = { ...c }
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })
  }

  async function placeOrder() {
    const lines = Object.entries(cart).flatMap(([id, qty]) => {
      const dish = dishes.find((d) => d.id === id)
      return dish ? [{ id, name: dish.name, qty, price: dish.price }] : []
    })
    if (lines.length === 0 || placing) return
    if (slug) {
      setPlacing(true)
      const result = await remote.place(lines)
      setPlacing(false)
      if (!result.ok) return setOrderError(result.error)
      setOrderError('')
      setCart({})
      go('confirmee')
      return
    }
    const created = ordersActions.create({ table, lines, source: 'client' })
    if (!created) {
      setOrderError('Impossible d’envoyer la commande. Appelez un serveur.')
      return
    }
    setOrderError('')
    setOrderId(created.id)
    try {
      window.sessionStorage.setItem(`${ORDER_KEY}:${table}`, created.id)
    } catch {
      /* stockage indisponible */
    }
    setCart({})
    go('confirmee')
  }

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0)

  if (needsQr) return <MessageScreen title="Scannez le QR code de votre table" text="Pour commander, scannez le QR code posé sur votre table avec l’appareil photo de votre téléphone." />
  if (slug && remote.status === 'loading') return <MessageScreen title="Chargement du menu…" />
  if (slug && remote.status === 'notfound') return <MessageScreen title="Restaurant introuvable" text="Scannez de nouveau le QR code de votre table, ou appelez un serveur." />
  if (slug && remote.status === 'error') return <MessageScreen title="Connexion impossible" text="Vérifiez votre connexion Internet, puis rechargez la page." />

  if (view === 'accueil') return <WelcomeScreen restaurantName={restaurantName} table={table} onStart={() => go('menu')} />

  if (view === 'confirmee' && order) {
    return (
      <>
        <div className="min-h-dvh bg-background">
          <ConfirmedScreen order={order} onTrack={() => go('suivi')} onReview={() => setReviewOpen(true)} onMenu={() => go('menu')} />
        </div>
        {reviewOpen && <ReviewSheet onClose={() => setReviewOpen(false)} onSubmit={submitReview} />}
      </>
    )
  }

  const dish = view === 'plat' && selectedId ? dishes.find((d) => d.id === selectedId) : undefined
  const tab: ClientTab | null = view === 'menu' ? 'menu' : view === 'panier' ? 'panier' : view === 'suivi' ? 'suivi' : null

  function navigate(t: ClientTab) {
    go(t === 'menu' ? 'menu' : t === 'panier' ? 'panier' : 'suivi')
  }

  const menu = (
    <MenuScreen
      restaurantName={restaurantName}
      dishes={dishes}
      table={table}
      category={category}
      onCategory={setCategory}
      cart={cart}
      cartCount={cartCount}
      onOpen={(id) => {
        setSelectedId(id)
        go('plat')
      }}
      onSetQty={setQty}
      onCart={() => go('panier')}
    />
  )

  return (
    <div className="min-h-dvh bg-background">
      <TopNav current={tab} onNavigate={navigate} cartCount={cartCount} hasOrder={orderActive} restaurant={restaurantName} table={table} />
      <div className={dish ? 'lg:px-8' : 'pb-24 lg:pb-12'}>
        {view === 'menu' && (
          <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 lg:px-8">
            {menu}
            <aside className="hidden lg:sticky lg:top-24 lg:mt-8 lg:block lg:self-start">
              <CartPanel error={orderError} serviceFee={slug ? remote.serviceFee : undefined} dishes={dishes} cart={cart} onSetQty={setQty} onOrder={placeOrder} onBrowse={() => go('menu')} />
            </aside>
          </div>
        )}
        {dish && (
          <DishScreen
            key={dish.id}
            dish={dish}
            initialQty={cart[dish.id] ?? 1}
            onBack={() => go('menu')}
            onAdd={(qty) => {
              setQty(dish.id, qty)
              go('menu')
            }}
          />
        )}
        {view === 'panier' && <CartScreen error={orderError} serviceFee={slug ? remote.serviceFee : undefined} dishes={dishes} cart={cart} onSetQty={setQty} onBack={() => go('menu')} onOrder={placeOrder} />}
        {view === 'suivi' && <TrackingScreen order={order} onMenu={() => go('menu')} onReview={() => setReviewOpen(true)} onBack={() => go('menu')} />}
      </div>
      {!dish && <BottomNav current={tab} onNavigate={navigate} cartCount={cartCount} hasOrder={orderActive} />}
      {reviewOpen && <ReviewSheet onClose={() => setReviewOpen(false)} onSubmit={submitReview} />}
    </div>
  )
}

function MessageScreen({ title, text }: { title: string; text?: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-center">
      <div className="max-w-sm">
        <h1 className="font-serif text-2xl font-semibold">{title}</h1>
        {text && <p className="mt-2 text-muted-foreground">{text}</p>}
      </div>
    </main>
  )
}
