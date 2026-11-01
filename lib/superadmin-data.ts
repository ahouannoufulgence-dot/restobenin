/** Données réelles de l'espace Super Admin (lecture seule, protégée par les règles d'accès de la base). */
import { getSupabase } from '@/lib/supabase/client'

export type RestaurantStatus = 'Actif' | 'Suspendu' | 'Résilié'

export type RestaurantRow = {
  id: string
  name: string
  address: string
  plan: string
  status: RestaurantStatus
  billing: 'Mensuel' | 'Annuel'
  createdAt: string
  owner: string
  tables: number
  /** Uniquement en mode démonstration (pas encore calculé depuis la base). */
  monthlyRevenue?: number
}

export type Overview = {
  restaurants: number
  activeSubscriptions: number
  newThisMonth: number
  openTickets: number
  monthlyRevenue: number
  signups12: number[]
}

export type AdminData = { overview: Overview; recent: RestaurantRow[] }

const STATUS: Record<string, RestaurantStatus> = { actif: 'Actif', suspendu: 'Suspendu', resilie: 'Résilié' }

type RawRestaurant = {
  id: string
  name: string
  address: string | null
  subscription: string
  billing: string
  created_at: string
  plans: { name: string } | { name: string }[] | null
  staff: { name: string; role: string }[] | null
  dining_tables: { count: number }[] | null
}

const RESTAURANT_SELECT = 'id, name, address, subscription, billing, created_at, plans(name), staff(name, role), dining_tables(count)'

function mapRestaurant(r: RawRestaurant): RestaurantRow {
  const plan = Array.isArray(r.plans) ? r.plans[0] : r.plans
  return {
    id: r.id,
    name: r.name,
    address: r.address?.trim() || '—',
    plan: plan?.name ?? '—',
    status: STATUS[r.subscription] ?? 'Actif',
    billing: r.billing === 'annuel' ? 'Annuel' : 'Mensuel',
    createdAt: r.created_at,
    owner: r.staff?.find((m) => m.role === 'gerant')?.name ?? '—',
    tables: r.dining_tables?.[0]?.count ?? 0,
  }
}

export async function loadAdminData(): Promise<AdminData> {
  const sb = getSupabase()
  const [stats, list] = await Promise.all([
    sb.rpc('admin_overview'),
    sb.from('restaurants').select(RESTAURANT_SELECT).order('created_at', { ascending: false }).limit(5),
  ])
  if (stats.error) throw new Error(stats.error.message)
  if (list.error) throw new Error(list.error.message)

  const s = stats.data as Record<string, unknown>
  const overview: Overview = {
    restaurants: Number(s.restaurants ?? 0),
    activeSubscriptions: Number(s.active_subscriptions ?? 0),
    newThisMonth: Number(s.new_this_month ?? 0),
    openTickets: Number(s.open_tickets ?? 0),
    monthlyRevenue: Number(s.monthly_revenue ?? 0),
    signups12: Array.isArray(s.signups_12_months) ? (s.signups_12_months as number[]).map(Number) : Array(12).fill(0),
  }
  return { overview, recent: ((list.data ?? []) as unknown as RawRestaurant[]).map(mapRestaurant) }
}

/* ------------------------------------------------------------------ sections */

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v)

export async function loadRestaurants(): Promise<RestaurantRow[]> {
  const { data, error } = await getSupabase().from('restaurants').select(RESTAURANT_SELECT).order('created_at', { ascending: false }).limit(500)
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as RawRestaurant[]).map(mapRestaurant)
}

export type SubscriptionRow = { id: string; name: string; plan: string; billing: 'Mensuel' | 'Annuel'; status: RestaurantStatus; monthlyFcfa: number; paymentMethod: string; changedAt: string }

export async function loadSubscriptions(): Promise<SubscriptionRow[]> {
  const { data, error } = await getSupabase()
    .from('restaurants')
    .select('id, name, subscription, billing, payment_method, plan_changed_at, plans(name, monthly_fcfa)')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw new Error(error.message)
  type Raw = { id: string; name: string; subscription: string; billing: string; payment_method: string; plan_changed_at: string; plans: { name: string; monthly_fcfa: number } | { name: string; monthly_fcfa: number }[] | null }
  return ((data ?? []) as unknown as Raw[]).map((r) => {
    const plan = one(r.plans)
    const monthly = plan?.monthly_fcfa ?? 0
    const annual = r.billing === 'annuel'
    return {
      id: r.id,
      name: r.name,
      plan: plan?.name ?? '—',
      billing: annual ? 'Annuel' : 'Mensuel',
      status: STATUS[r.subscription] ?? 'Actif',
      // Même règle que admin_overview() : −20 % pour la facturation annuelle.
      monthlyFcfa: annual ? Math.round(monthly * 0.8) : monthly,
      paymentMethod: r.payment_method,
      changedAt: r.plan_changed_at,
    }
  })
}

export type PaymentRow = { id: string; invoice: string; restaurant: string; plan: string; amountFcfa: number; method: string; periodStart: string; periodEnd: string; status: 'payee' | 'en_attente' | 'echec' }

export async function loadPayments(): Promise<PaymentRow[]> {
  const { data, error } = await getSupabase()
    .from('subscription_payments')
    .select('id, invoice_number, plan_id, amount_fcfa, method, period_start, period_end, status, restaurants(name)')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw new Error(error.message)
  type Raw = { id: string; invoice_number: string; plan_id: string; amount_fcfa: number; method: string; period_start: string; period_end: string; status: PaymentRow['status']; restaurants: { name: string } | { name: string }[] | null }
  return ((data ?? []) as unknown as Raw[]).map((r) => ({
    id: r.id,
    invoice: r.invoice_number,
    restaurant: one(r.restaurants)?.name ?? '—',
    plan: r.plan_id,
    amountFcfa: r.amount_fcfa,
    method: r.method,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    status: r.status,
  }))
}

export type TicketStatus = 'ouvert' | 'en_cours' | 'resolu'
export type TicketRow = { id: string; subject: string; message: string; status: TicketStatus; restaurant: string; createdAt: string }

export async function loadTickets(): Promise<TicketRow[]> {
  const { data, error } = await getSupabase()
    .from('support_tickets')
    .select('id, subject, message, status, created_at, restaurants(name)')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw new Error(error.message)
  type Raw = { id: string; subject: string; message: string; status: TicketStatus; created_at: string; restaurants: { name: string } | { name: string }[] | null }
  return ((data ?? []) as unknown as Raw[]).map((r) => ({ id: r.id, subject: r.subject, message: r.message, status: r.status, restaurant: one(r.restaurants)?.name ?? '—', createdAt: r.created_at }))
}

/** Change l'état d'un ticket (réservé au super admin). Renvoie un message d'erreur, ou null si tout va bien. */
export async function updateTicketStatus(id: string, status: TicketStatus): Promise<string | null> {
  const { data, error } = await getSupabase().from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('id')
  if (error) return error.message
  // Une règle d'accès qui refuse la modification ne renvoie pas d'erreur : simplement aucune ligne modifiée.
  if (!data || data.length === 0) return 'Modification refusée.'
  return null
}

export type UserRow = { id: string; name: string; role: string; restaurant: string; email: string; phone: string; status: 'actif' | 'conge'; createdAt: string }

export async function loadUsers(): Promise<UserRow[]> {
  const { data, error } = await getSupabase()
    .from('staff')
    .select('id, name, role, email, phone, status, created_at, restaurants(name)')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw new Error(error.message)
  type Raw = { id: string; name: string; role: string; email: string; phone: string; status: 'actif' | 'conge'; created_at: string; restaurants: { name: string } | { name: string }[] | null }
  return ((data ?? []) as unknown as Raw[]).map((r) => ({ id: r.id, name: r.name, role: r.role, restaurant: one(r.restaurants)?.name ?? '—', email: r.email, phone: r.phone, status: r.status, createdAt: r.created_at }))
}

export type PlanRow = { id: string; name: string; monthlyFcfa: number; teamLimit: number | null }

export async function loadPlans(): Promise<PlanRow[]> {
  const { data, error } = await getSupabase().from('plans').select('id, name, monthly_fcfa, team_limit').order('sort_order')
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({ id: p.id as string, name: p.name as string, monthlyFcfa: p.monthly_fcfa as number, teamLimit: (p.team_limit as number | null) ?? null }))
}

/** Série mensuelle pour le graphique : `values` = 12 derniers mois, le dernier étant le mois en cours. */
export function signupSeriesFrom(values: number[], months: number, now = new Date()) {
  return values.slice(-months).map((value, i, arr) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (arr.length - 1 - i), 1)
    const label = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
    return { label: label.charAt(0).toUpperCase() + label.slice(1), value }
  })
}

/** Suspend ou réactive un restaurant (Super Admin). Le motif est conservé dans le journal des actions. Lance une erreur si la base refuse. */
export async function setRestaurantStatus(restaurantId: string, status: 'actif' | 'suspendu', reason: string): Promise<void> {
  const { error } = await getSupabase().rpc('admin_set_subscription_status', { p_restaurant: restaurantId, p_status: status, p_reason: reason.trim() || null })
  if (error) throw new Error(error.message)
}

export type AuditRow = { id: string; action: 'suspension' | 'reactivation'; restaurant: string; reason: string; createdAt: string }

/** Dernières actions du Super Admin (suspensions et réactivations). */
export async function loadAuditLog(): Promise<AuditRow[]> {
  const { data, error } = await getSupabase()
    .from('platform_audit_log')
    .select('id, action, restaurant_name, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({ id: r.id as string, action: r.action as AuditRow['action'], restaurant: r.restaurant_name as string, reason: (r.detail as string | null) ?? '', createdAt: r.created_at as string }))
}
