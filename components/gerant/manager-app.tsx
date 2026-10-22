'use client'

import { useMemo, useState } from 'react'
import { initialTables, stock, type ManagerView, type RestaurantTable, type TableStatus } from '@/lib/gerant-data'
import { menuActions, useMenu } from '@/lib/menu-store'
import { isUnpaid, ordersActions, useOrders } from '@/lib/orders-store'
import { todayStats } from '@/lib/reports'
import { tableNumber, useSettings } from '@/lib/settings-store'
import { WelcomeScreen } from './welcome-screen'
import { BottomNav, Sidebar } from './manager-nav'
import { DashboardScreen } from './dashboard-screen'
import { OrdersScreen } from './orders-screen'
import { KitchenScreen } from './kitchen-screen'
import { CashierScreen } from './cashier-screen'
import { TablesScreen } from './tables-screen'
import { MenuScreen } from './menu-screen'
import { ReportsScreen } from './reports-screen'
import { MoreScreen } from './more-screen'
import { SettingsScreen } from './settings-screen'

const nextTableStatus: Record<TableStatus, TableStatus> = { libre: 'occupee', occupee: 'reservee', reservee: 'libre' }

export function ManagerApp() {
  const [started, setStarted] = useState(false)
  const [view, setView] = useState<ManagerView>('accueil')
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables)

  // Données partagées entre tous les modules (et avec l'espace client).
  const orders = useOrders()
  const dishes = useMenu()
  const settings = useSettings()

  const sales = useMemo(() => todayStats(orders, settings.demoData), [orders, settings.demoData])

  function navigate(next: ManagerView) {
    setStarted(true)
    setView(next)
    window.scrollTo({ top: 0 })
  }

  if (!started) {
    return <WelcomeScreen onStart={() => navigate('accueil')} onModules={() => navigate('plus')} />
  }

  // Une table est « occupée » tant qu'elle a une commande non encaissée.
  const openTables = new Set(orders.filter(isUnpaid).map((o) => o.table))
  const tablesView: RestaurantTable[] = tables.map((t) => (openTables.has(tableNumber(t.id)) ? { ...t, status: 'occupee' } : t))

  const cycleTable = (id: string) => {
    if (openTables.has(tableNumber(id))) return
    setTables((list) => list.map((t) => (t.id === id ? { ...t, status: nextTableStatus[t.status] } : t)))
  }
  const addTable = () => setTables((list) => [...list, { id: `T${list.length + 1}`, seats: 4, status: 'libre' }])

  const badges = {
    commandes: orders.filter((o) => o.status === 'en_attente').length,
    cuisine: orders.filter((o) => o.status === 'en_attente' || o.status === 'en_cours').length,
    caisse: orders.filter(isUnpaid).length,
    plus: stock.alerts,
  }
  const navCurrent = view === 'parametres' || view === 'qr' ? 'plus' : view

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <Sidebar current={navCurrent} onNavigate={navigate} badges={badges} restaurantName={settings.restaurantName} />
      <main className="flex-1 pb-28 lg:pb-12">
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          {view === 'accueil' && <DashboardScreen orders={orders} tables={tablesView} sales={sales} restaurantName={settings.restaurantName} onNavigate={navigate} />}
          {view === 'commandes' && <OrdersScreen orders={orders} onUpdate={ordersActions.setStatus} />}
          {view === 'cuisine' && <KitchenScreen orders={orders} dishes={dishes} onUpdate={ordersActions.setStatus} onToggleDish={menuActions.toggle} />}
          {view === 'caisse' && <CashierScreen orders={orders} dishes={dishes} settings={settings} />}
          {view === 'tables' && <TablesScreen tables={tablesView} onCycle={cycleTable} onAdd={addTable} />}
          {view === 'menu' && <MenuScreen dishes={dishes} onToggle={menuActions.toggle} onSave={menuActions.save} onRemove={menuActions.remove} newId={menuActions.newId} />}
          {view === 'rapports' && <ReportsScreen orders={orders} settings={settings} />}
          {view === 'plus' && <MoreScreen onNavigate={navigate} />}
          {(view === 'parametres' || view === 'qr') && <SettingsScreen key={view} tables={tablesView} focusQr={view === 'qr'} onBack={() => navigate('plus')} />}
        </div>
      </main>
      <BottomNav current={navCurrent} onNavigate={navigate} badges={badges} />
    </div>
  )
}
