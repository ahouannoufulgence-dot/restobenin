'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { firstName as firstNameOf, useAccount } from '@/lib/account-store'
import { getPlan, teamLimits } from '@/lib/plans'
import { getSession, restoreRemoteSession, signOut, type Session } from '@/lib/auth'
import { supabaseConfigured } from '@/lib/supabase/client'
import { hydrate } from '@/lib/supabase/hydrate'
import { clearSyncError, isRemote, useHydration, useSyncError } from '@/lib/supabase/runtime'
import { findEmployee, useEmployees } from '@/lib/employees-store'
import { accessFor, usePermissionOverrides } from '@/lib/permissions'
import { summarize, useStock } from '@/lib/stock-store'
import { initialTables, manager, type ManagerView, type RestaurantTable, type TableStatus } from '@/lib/gerant-data'
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
import { EmployeesScreen } from './employees-screen'
import { StockScreen } from './stock-screen'
import { AccountScreen } from './account-screen'
import { HelpScreen } from './help-screen'

const nextTableStatus: Record<TableStatus, TableStatus> = { libre: 'occupee', occupee: 'reservee', reservee: 'libre' }

export function ManagerApp() {
  const [started, setStarted] = useState(false)
  const [view, setView] = useState<ManagerView>('accueil')
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables)
  const router = useRouter()
  // undefined : lecture de la session en cours ; null : personne n'est connecté.
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [startSale, setStartSale] = useState(false)
  const [helpStart, setHelpStart] = useState(false)

  // Données partagées entre tous les modules (et avec l'espace client).
  const orders = useOrders()
  const dishes = useMenu()
  const settings = useSettings()
  const employees = useEmployees()
  const stock = useStock()
  const account = useAccount()
  const overrides = usePermissionOverrides()

  const hydration = useHydration()
  const syncError = useSyncError()

  useEffect(() => {
    let current = getSession()
    // Base de données : une session sans restaurant (ancienne session de démonstration) n'ouvre rien.
    if (supabaseConfigured && current && !current.restaurantId) {
      signOut()
      current = null
    }
    if (!current) router.replace('/connexion')
    setSession(current)
  }, [router])

  // Après un rechargement de la page : on vérifie la connexion puis on recharge les données du restaurant.
  useEffect(() => {
    if (!supabaseConfigured || !session?.restaurantId || isRemote()) return
    let cancelled = false
    void restoreRemoteSession().then((ok) => {
      if (cancelled || ok) return
      if (!getSession()) return
      signOut()
      router.replace('/connexion')
    })
    return () => {
      cancelled = true
    }
  }, [session, router])

  // Droits : le gérant a tout ; un employé a les droits de sa fonction (relue dans la liste d'équipe,
  // donc un changement de fonction ou un congé s'applique tout de suite).
  const isEmployee = session?.role === 'employe'
  const me = isEmployee && session ? findEmployee(session.identifier) : undefined
  const suspended = isEmployee && (!me || me.status !== 'actif')
  const access = useMemo(() => accessFor(isEmployee && me ? me.role : 'gerant', overrides), [isEmployee, me, overrides])
  const isManager = access.role === 'gerant'
  const sessionName = session?.name ?? null
  // Prénom affiché : celui de la session ; à défaut, le responsable inscrit ; à défaut (démo), le gérant fictif.
  const firstName = sessionName ? firstNameOf(sessionName) : !isEmployee && account ? firstNameOf(account.manager) : manager.firstName
  const plan = account ? getPlan(account.planId) : null
  const establishmentLine = account && plan ? `${account.establishment} · Formule ${plan.name}` : `${manager.city} · Formule Standard`

  const sales = useMemo(() => todayStats(orders, settings.demoData), [orders, settings.demoData])

  // Ouvre une vue sans contrôle (réservé aux raccourcis déjà autorisés, comme « Nouvelle commande »).
  function goTo(next: ManagerView) {
    setStarted(true)
    setStartSale(false)
    setHelpStart(false)
    setView(next)
    window.scrollTo({ top: 0 })
  }

  // Ouvre une vue seulement si la fonction de la personne y donne accès.
  function navigate(next: ManagerView) {
    if (!access.canView(next)) return
    goTo(next)
  }

  // Une fonction sans tableau de bord (cuisinier, serveur…) arrive directement sur son module, sans écran d'accueil.
  const noHome = !!session && !suspended && !access.canView('accueil')
  useEffect(() => {
    if (noHome) {
      setStarted(true)
      setView(access.home)
    }
  }, [noHome, access.home])

  if (session === undefined || session === null) return null

  // Base de données : on attend les données du restaurant avant d'afficher quoi que ce soit.
  if (supabaseConfigured && hydration !== 'ready') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center" role="status">
          {hydration === 'error' ? (
            <>
              <h1 className="font-serif text-2xl font-semibold">Chargement impossible</h1>
              <p className="mt-2 text-sm text-muted-foreground">{syncError ?? 'Vérifiez votre connexion Internet.'}</p>
              <div className="mt-5 grid gap-2">
                <button type="button" onClick={() => { clearSyncError(); void hydrate() }} className="h-12 rounded-xl bg-ember-deep text-sm font-semibold text-primary-foreground">Réessayer</button>
                <Link href="/connexion" onClick={signOut} className="inline-flex h-11 items-center justify-center text-sm font-semibold text-muted-foreground hover:text-foreground">Se déconnecter</Link>
              </div>
            </>
          ) : (
            <p className="font-serif text-xl text-muted-foreground">Chargement de votre restaurant…</p>
          )}
        </div>
      </main>
    )
  }

  if (suspended) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]">
          <h1 className="font-serif text-3xl font-semibold">Accès indisponible</h1>
          <p className="mt-3 text-muted-foreground">Votre compte n’est plus actif sur cet établissement (congé ou retrait de l’équipe). Contactez votre gérant.</p>
          <Link href="/connexion" onClick={signOut} className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-ember-deep px-6 text-sm font-semibold text-primary-foreground hover:bg-ember-deep/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40">
            Se déconnecter
          </Link>
        </div>
      </main>
    )
  }

  if (!started) {
    return (
      <WelcomeScreen
        firstName={firstName}
        restaurantName={settings.restaurantName}
        onStart={() => navigate(access.canView('accueil') ? 'accueil' : access.home)}
        onModules={() => navigate('plus')}
      />
    )
  }

  // Une table est « occupée » tant qu'elle a une commande non encaissée.
  const openTables = new Set(orders.filter(isUnpaid).map((o) => o.table))
  const tablesView: RestaurantTable[] = tables.map((t) => (openTables.has(tableNumber(t.id)) ? { ...t, status: 'occupee' } : t))

  // Bouton central « Nouvelle commande » : ouvre directement la vente au comptoir.
  const newOrder = () => {
    if (!access.createOrders) return
    goTo('caisse')
    setStartSale(true)
  }

  // « Contactez le support » : ouvre directement le formulaire de contact.
  const openSupport = () => {
    goTo('aide')
    setHelpStart(true)
  }

  const cycleTable = (id: string) => {
    if (openTables.has(tableNumber(id))) return
    setTables((list) => list.map((t) => (t.id === id ? { ...t, status: nextTableStatus[t.status] } : t)))
  }
  const addTable = () => setTables((list) => [...list, { id: `T${list.length + 1}`, seats: 4, status: 'libre' }])

  const badges = {
    commandes: orders.filter((o) => o.status === 'en_attente').length,
    cuisine: orders.filter((o) => o.status === 'en_attente' || o.status === 'en_cours').length,
    caisse: orders.filter(isUnpaid).length,
    plus: summarize(stock.items).critical,
  }
  // Si les droits changent pendant que la personne est sur un module, elle revient à son module d'accueil.
  const allowedHere = view === 'caisse' ? access.canView('caisse') || access.createOrders : access.canView(view)
  const current: ManagerView = allowedHere ? view : access.home
  const navCurrent = current === 'parametres' || current === 'qr' || current === 'employes' || current === 'stock' || current === 'abonnement' || current === 'aide' ? 'plus' : current
  const tableNumbers = tablesView.map((t) => tableNumber(t.id))
  const hiddenInSidebar = (['accueil', 'commandes', 'cuisine', 'caisse', 'tables', 'menu', 'rapports'] as ManagerView[]).filter((v) => !access.canView(v))

  return (
    <div className="min-h-dvh bg-background lg:flex">
      {syncError && (
        <div role="alert" className="fixed inset-x-0 top-0 z-50 flex items-start gap-3 bg-destructive px-4 py-3 text-sm font-medium text-white shadow-lg">
          <span className="min-w-0 flex-1">{syncError}</span>
          <button type="button" onClick={clearSyncError} className="shrink-0 rounded-md px-2 py-0.5 font-semibold underline">Fermer</button>
        </div>
      )}
      <Sidebar current={navCurrent} onNavigate={navigate} badges={badges} restaurantName={settings.restaurantName} subtitle={establishmentLine} hidden={hiddenInSidebar} />
      <main className="flex-1 pb-36 lg:pb-12">
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          {current === 'accueil' && <DashboardScreen orders={orders} dishes={dishes} tables={tablesView} sales={sales} firstName={firstName} canViewReports={access.canView('rapports')} onNavigate={navigate} />}
          {current === 'commandes' && <OrdersScreen orders={orders} onUpdate={ordersActions.setStatus} />}
          {current === 'cuisine' && <KitchenScreen orders={orders} dishes={dishes} onUpdate={ordersActions.setStatus} onToggleDish={menuActions.toggle} />}
          {current === 'caisse' && <CashierScreen orders={orders} dishes={dishes} settings={settings} startWithSale={startSale} canCollect={access.canCollect} tables={tableNumbers} />}
          {current === 'tables' && <TablesScreen tables={tablesView} onCycle={cycleTable} onAdd={addTable} canAdd={access.canView('parametres')} />}
          {current === 'menu' && <MenuScreen dishes={dishes} onToggle={menuActions.toggle} onSave={menuActions.save} onRemove={menuActions.remove} newId={menuActions.newId} canEdit={access.editMenu} />}
          {current === 'rapports' && <ReportsScreen orders={orders} settings={settings} tableCount={tablesView.length} pending={badges.commandes} onNavigate={navigate} />}
          {current === 'plus' && <MoreScreen onNavigate={navigate} canView={access.canView} />}
          {current === 'employes' && (
            <EmployeesScreen employees={employees} limit={account ? teamLimits[account.planId] : null} planName={plan?.name} onOpenPlan={() => navigate('abonnement')} />
          )}
          {current === 'abonnement' && (
            <AccountScreen
              account={account}
              restaurantName={settings.restaurantName}
              phone={settings.phone}
              memberCount={employees.length}
              notifications={orders.filter((o) => o.status === 'en_attente').length}
              onNavigate={navigate}
              onSupport={openSupport}
            />
          )}
          {current === 'aide' && <HelpScreen isManager={isManager} onNavigate={navigate} initial={helpStart ? 'contact' : undefined} />}
          {current === 'stock' && <StockScreen items={stock.items} movements={stock.movements} />}
          {(current === 'parametres' || current === 'qr') && <SettingsScreen key={current} tables={tablesView} focusQr={current === 'qr'} onBack={() => navigate('plus')} canEditRoles={isManager} />}
        </div>
      </main>
      <BottomNav current={navCurrent} onNavigate={navigate} badges={badges} canView={access.canView} canCreateOrder={access.createOrders} onNewOrder={newOrder} />
    </div>
  )
}
