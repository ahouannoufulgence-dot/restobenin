'use client'

import { useState } from 'react'
import {
  initialOrders,
  initialTables,
  stock,
  type ManagerView,
  type Order,
  type OrderStatus,
  type RestaurantTable,
  type TableStatus,
} from '@/lib/gerant-data'
import { menuActions, useMenu } from '@/lib/menu-store'
import { WelcomeScreen } from './welcome-screen'
import { BottomNav, Sidebar } from './manager-nav'
import { DashboardScreen } from './dashboard-screen'
import { OrdersScreen } from './orders-screen'
import { TablesScreen } from './tables-screen'
import { MenuScreen } from './menu-screen'
import { ReportsScreen } from './reports-screen'
import { MoreScreen } from './more-screen'

const nextTableStatus: Record<TableStatus, TableStatus> = { libre: 'occupee', occupee: 'reservee', reservee: 'libre' }

export function ManagerApp() {
  const [started, setStarted] = useState(false)
  const [view, setView] = useState<ManagerView>('accueil')
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables)
  const dishes = useMenu()

  function navigate(next: ManagerView) {
    setStarted(true)
    setView(next)
    window.scrollTo({ top: 0 })
  }

  if (!started) {
    return <WelcomeScreen onStart={() => navigate('accueil')} onModules={() => navigate('plus')} />
  }

  const updateOrder = (id: string, status: OrderStatus) => setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)))
  const cycleTable = (id: string) => setTables((list) => list.map((t) => (t.id === id ? { ...t, status: nextTableStatus[t.status] } : t)))
  const addTable = () => setTables((list) => [...list, { id: `T${list.length + 1}`, seats: 4, status: 'libre' }])

  const badges = {
    commandes: orders.filter((o) => o.status === 'en_attente').length,
    plus: stock.alerts,
  }

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <Sidebar current={view} onNavigate={navigate} badges={badges} />
      <main className="flex-1 pb-28 lg:pb-12">
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          {view === 'accueil' && <DashboardScreen orders={orders} tables={tables} onNavigate={navigate} />}
          {view === 'commandes' && <OrdersScreen orders={orders} onUpdate={updateOrder} />}
          {view === 'tables' && <TablesScreen tables={tables} onCycle={cycleTable} onAdd={addTable} />}
          {view === 'menu' && <MenuScreen dishes={dishes} onToggle={menuActions.toggle} onSave={menuActions.save} onRemove={menuActions.remove} newId={menuActions.newId} />}
          {view === 'rapports' && <ReportsScreen />}
          {view === 'plus' && <MoreScreen onNavigate={navigate} />}
        </div>
      </main>
      <BottomNav current={view} onNavigate={navigate} badges={badges} />
    </div>
  )
}
