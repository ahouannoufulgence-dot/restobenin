import { type Account, applyRemoteAccount } from '@/lib/account-store'
import { type Employee, type EmployeeRole, applyRemoteEmployees } from '@/lib/employees-store'
import { DEFAULT_PERMISSIONS, applyRemotePermissions, editableRoles, type ConfigurableView, type RolePermissions } from '@/lib/permissions'
import type { Billing, PlanId } from '@/lib/plans'
import { applyRemoteMenu, type MenuDish } from '@/lib/menu-store'
import { REMOTE_ORDERS_WINDOW_DAYS, applyRemoteOrders, loadRemoteOrders } from '@/lib/orders-store'
import { applyRemoteSettings } from '@/lib/settings-store'
import { applyRemoteStock, type StockItem, type StockMovement } from '@/lib/stock-store'
import { applyRemoteTables } from '@/lib/tables-store'
import { publicUrl } from './api'
import { getSupabase } from './client'
import { friendlyError, getRemote, reportSyncError, setHydration, setRehydrator } from './runtime'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Charge depuis la base tout ce qui concerne le restaurant connecté (fiche, équipe, droits, dernière facture)
 * et le place dans les stores. Les règles d'accès (RLS) font que chaque personne ne reçoit que ce qu'elle a le droit de voir.
 */
export async function hydrate(): Promise<boolean> {
  const ctx = getRemote()
  if (!ctx) return false
  setHydration('loading')
  try {
    const sb = getSupabase()
    const [r, s, p, inv, m, t] = await Promise.all([
      sb.from('restaurants').select('*').eq('id', ctx.restaurantId).single(),
      sb.from('staff').select('*').eq('restaurant_id', ctx.restaurantId).order('created_at'),
      sb.from('role_permissions').select('*').eq('restaurant_id', ctx.restaurantId),
      sb
        .from('subscription_payments')
        .select('invoice_number, period_start, period_end, amount_fcfa')
        .eq('restaurant_id', ctx.restaurantId)
        .order('created_at', { ascending: false })
        .limit(1),
      sb.from('menu_items').select('*').eq('restaurant_id', ctx.restaurantId).order('position').order('created_at'),
      sb.from('dining_tables').select('number, seats, status').eq('restaurant_id', ctx.restaurantId),
    ])
    if (r.error || !r.data) throw new Error(r.error?.message ?? 'Restaurant introuvable.')
    if (s.error) throw new Error(s.error.message)
    if (p.error) throw new Error(p.error.message)
    if (m.error) throw new Error(m.error.message)
    if (t.error) throw new Error(t.error.message)

    const rest = r.data as any
    const staffRows = (s.data ?? []) as any[]
    const me = staffRows.find((x) => x.id === ctx.staffId)

    applyRemoteSettings({
      restaurantName: rest.name,
      siteUrl: rest.site_url ?? '',
      address: rest.address ?? '',
      phone: rest.phone ?? '',
      receiptFooter: rest.receipt_footer ?? 'Merci de votre visite !',
      demoData: false, // un vrai restaurant n'a pas d'historique fictif
      restaurantSlug: rest.slug,
    })

    const employees: Employee[] = staffRows.map((x) => ({
      id: x.id,
      name: x.name,
      role: x.role as EmployeeRole,
      phone: x.phone,
      email: x.email,
      status: x.status,
      photo: publicUrl(x.photo_path),
    }))
    applyRemoteEmployees(employees)

    const dishes: MenuDish[] = ((m.data ?? []) as any[]).map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description ?? '',
      price: d.price_fcfa,
      category: d.category,
      image: publicUrl(d.image_path),
      available: !!d.available,
    }))
    applyRemoteMenu(dishes)
    applyRemoteTables(((t.data ?? []) as any[]).map((x) => ({ number: x.number, seats: x.seats, status: x.status })))

    // Les commandes ne doivent pas bloquer l'ouverture de l'application : en cas d'échec on affiche l'erreur et on repart d'une liste vide.
    try {
      applyRemoteOrders(await loadRemoteOrders(REMOTE_ORDERS_WINDOW_DAYS), 0)
    } catch (e) {
      applyRemoteOrders([], 0)
      reportSyncError(`Chargement des commandes : ${friendlyError(e instanceof Error ? e.message : String(e))}`)
    }

    // Stock : réservé aux fonctions qui y ont accès (sinon la base renvoie des listes vides). N'empêche pas non plus l'ouverture.
    try {
      const [si, sm] = await Promise.all([
        sb.from('stock_items').select('*').eq('restaurant_id', ctx.restaurantId).order('created_at'),
        sb.from('stock_movements').select('*').eq('restaurant_id', ctx.restaurantId).order('created_at', { ascending: false }).limit(200),
      ])
      if (si.error) throw new Error(si.error.message)
      if (sm.error) throw new Error(sm.error.message)
      const items: StockItem[] = ((si.data ?? []) as any[]).map((i) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        qty: Number(i.qty),
        threshold: Number(i.threshold),
        unitCost: i.unit_cost_fcfa,
        trend: i.trend ?? 0,
        kind: i.kind,
        image: publicUrl(i.image_path),
      }))
      const movements: StockMovement[] = ((sm.data ?? []) as any[]).map((x) => ({
        id: x.id,
        itemId: x.stock_item_id ?? '',
        itemName: x.item_name,
        unit: x.unit,
        type: x.type,
        qty: Number(x.qty),
        note: x.note ?? undefined,
        at: Date.parse(x.created_at),
      }))
      applyRemoteStock(items, movements)
    } catch (e) {
      applyRemoteStock([], [])
      reportSyncError(`Chargement du stock : ${friendlyError(e instanceof Error ? e.message : String(e))}`)
    }

    const overrides: Partial<Record<EmployeeRole, RolePermissions>> = {}
    for (const row of (p.data ?? []) as any[]) {
      const role = row.role as EmployeeRole
      if (!editableRoles.includes(role)) continue
      overrides[role] = {
        views: row.views as ConfigurableView[],
        createOrders: !!row.create_orders,
        editMenu: !!row.edit_menu,
        home: (row.home as ConfigurableView) ?? DEFAULT_PERMISSIONS[role].home,
      }
    }
    applyRemotePermissions(overrides)

    const last = ((inv.data ?? []) as any[])[0]
    const account: Account = {
      restaurant: rest.name,
      manager: me?.name ?? '',
      email: me?.email ?? '',
      phone: rest.phone ?? '',
      establishment: rest.establishment,
      planId: rest.plan_id as PlanId,
      billing: rest.billing as Billing,
      paymentMethod: rest.payment_method,
      createdAt: Date.parse(rest.created_at),
      planChangedAt: Date.parse(rest.plan_changed_at),
      lastInvoice: last
        ? { number: last.invoice_number, periodStart: Date.parse(last.period_start), periodEnd: Date.parse(last.period_end), amount: last.amount_fcfa }
        : undefined,
    }
    applyRemoteAccount(account)

    setHydration('ready')
    return true
  } catch (e) {
    setHydration('error')
    reportSyncError(`Chargement des données : ${friendlyError(e instanceof Error ? e.message : String(e))}`)
    return false
  }
}

setRehydrator(hydrate)
