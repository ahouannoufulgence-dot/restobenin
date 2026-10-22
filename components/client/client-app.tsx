'use client'

import { useEffect, useMemo, useState } from 'react'
import { SERVICE_FEE, restaurant, type Category, type PlacedOrder } from '@/lib/client-data'
import { useClientDishes } from '@/lib/menu-store'
import { BottomNav, TopNav, type ClientTab } from './bottom-nav'
import { CartPanel, CartScreen } from './cart-screen'
import { ConfirmedScreen } from './confirmed-screen'
import { DishScreen } from './dish-screen'
import { MenuScreen } from './menu-screen'
import { ReviewSheet } from './review-sheet'
import { TrackingScreen } from './tracking-screen'
import { WelcomeScreen } from './welcome-screen'

type View = 'accueil' | 'menu' | 'plat' | 'panier' | 'confirmee' | 'suivi'

// Démo : la commande avance toute seule d'une étape toutes les 8 secondes.
// Quand le backend sera branché, cette progression viendra de l'espace gérant.
const STAGE_DELAY_MS = 8000

export function ClientApp({ table }: { table: string }) {
  const [view, setView] = useState<View>('accueil')
  const [category, setCategory] = useState<Category | 'tous'>('tous')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dishes = useClientDishes()
  const [rawCart, setCart] = useState<Record<string, number>>({})
  const [order, setOrder] = useState<PlacedOrder | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  // Si le gérant retire un plat ou le rend indisponible, il disparaît aussi du panier.
  const cart = useMemo(() => Object.fromEntries(Object.entries(rawCart).filter(([id]) => dishes.some((d) => d.id === id && d.available))), [rawCart, dishes])

  const orderStage = order?.stage ?? 0
  const orderActive = order !== null && orderStage < 3

  useEffect(() => {
    if (!orderActive) return
    const timer = window.setTimeout(() => {
      setOrder((o) => (o && o.stage < 3 ? { ...o, stage: o.stage + 1, times: [...o.times, Date.now()] } : o))
    }, STAGE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [orderActive, orderStage])

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

  function placeOrder() {
    const lines = Object.entries(cart).flatMap(([id, qty]) => {
      const dish = dishes.find((d) => d.id === id)
      return dish ? [{ id, name: dish.name, qty, price: dish.price }] : []
    })
    if (lines.length === 0) return
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
    setOrder({
      number: String(Math.floor(Math.random() * 900) + 100).padStart(4, '0'),
      lines,
      subtotal,
      total: subtotal + SERVICE_FEE,
      stage: 0,
      times: [Date.now()],
    })
    setCart({})
    go('confirmee')
  }

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0)

  if (view === 'accueil') return <WelcomeScreen table={table} onStart={() => go('menu')} />

  if (view === 'confirmee' && order) {
    return (
      <>
        <div className="min-h-dvh bg-background">
          <ConfirmedScreen order={order} onTrack={() => go('suivi')} onReview={() => setReviewOpen(true)} onMenu={() => go('menu')} />
        </div>
        {reviewOpen && <ReviewSheet onClose={() => setReviewOpen(false)} />}
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
      <TopNav current={tab} onNavigate={navigate} cartCount={cartCount} hasOrder={orderActive} restaurant={restaurant.name} table={table} />
      <div className={dish ? 'lg:px-8' : 'pb-24 lg:pb-12'}>
        {view === 'menu' && (
          <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 lg:px-8">
            {menu}
            <aside className="hidden lg:sticky lg:top-24 lg:mt-8 lg:block lg:self-start">
              <CartPanel dishes={dishes} cart={cart} onSetQty={setQty} onOrder={placeOrder} onBrowse={() => go('menu')} />
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
        {view === 'panier' && <CartScreen dishes={dishes} cart={cart} onSetQty={setQty} onBack={() => go('menu')} onOrder={placeOrder} />}
        {view === 'suivi' && <TrackingScreen order={order} onMenu={() => go('menu')} onReview={() => setReviewOpen(true)} onBack={() => go('menu')} />}
      </div>
      {!dish && <BottomNav current={tab} onNavigate={navigate} cartCount={cartCount} hasOrder={orderActive} />}
      {reviewOpen && <ReviewSheet onClose={() => setReviewOpen(false)} />}
    </div>
  )
}
