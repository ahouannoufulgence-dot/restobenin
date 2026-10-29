import { type Account, applyRemoteAccount } from '@/lib/account-store'
import { type Employee, type EmployeeRole, applyRemoteEmployees } from '@/lib/employees-store'
import { DEFAULT_PERMISSIONS, applyRemotePermissions, editableRoles, type ConfigurableView, type RolePermissions } from '@/lib/permissions'
import type { Billing, PlanId } from '@/lib/plans'
import { applyRemoteSettings } from '@/lib/settings-store'
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
    const [r, s, p, inv] = await Promise.all([
      sb.from('restaurants').select('*').eq('id', ctx.restaurantId).single(),
      sb.from('staff').select('*').eq('restaurant_id', ctx.restaurantId).order('created_at'),
      sb.from('role_permissions').select('*').eq('restaurant_id', ctx.restaurantId),
      sb
        .from('subscription_payments')
        .select('invoice_number, period_start, period_end, amount_fcfa')
        .eq('restaurant_id', ctx.restaurantId)
        .order('created_at', { ascending: false })
        .limit(1),
    ])
    if (r.error || !r.data) throw new Error(r.error?.message ?? 'Restaurant introuvable.')
    if (s.error) throw new Error(s.error.message)
    if (p.error) throw new Error(p.error.message)

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
