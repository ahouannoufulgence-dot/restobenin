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

export async function loadAdminData(): Promise<AdminData> {
  const sb = getSupabase()
  const [stats, list] = await Promise.all([
    sb.rpc('admin_overview'),
    sb
      .from('restaurants')
      .select('id, name, address, subscription, billing, created_at, plans(name), staff(name, role), dining_tables(count)')
      .order('created_at', { ascending: false })
      .limit(5),
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

  const recent = ((list.data ?? []) as unknown as RawRestaurant[]).map((r): RestaurantRow => {
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
  })
  return { overview, recent }
}

/** Série mensuelle pour le graphique : `values` = 12 derniers mois, le dernier étant le mois en cours. */
export function signupSeriesFrom(values: number[], months: number, now = new Date()) {
  return values.slice(-months).map((value, i, arr) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (arr.length - 1 - i), 1)
    const label = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
    return { label: label.charAt(0).toUpperCase() + label.slice(1), value }
  })
}
