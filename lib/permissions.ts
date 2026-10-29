import { useSyncExternalStore } from 'react'
import type { ManagerView } from './gerant-data'
import type { EmployeeRole } from './employees-store'
import { api } from './supabase/api'
import { background, getRemote, onRemoteReset } from './supabase/runtime'

/**
 * Droits d'accès par fonction (gérant, chef, cuisinier, serveur, caissier, stockiste).
 *
 * Un employé ne voit et ne peut ouvrir que les modules autorisés pour sa fonction ; certaines actions
 * sensibles ont leur propre droit (encaisser = module Caisse, créer une commande, modifier le menu).
 * Le gérant ajuste ces droits dans Paramètres > Rôles et accès ; le rôle « Gérant » a toujours tout.
 *
 * ATTENTION : tant que la base de données n'est pas branchée, ces restrictions sont appliquées dans
 * l'interface (navigateur). Elles organisent le travail de l'équipe mais ne constituent pas une
 * protection : il faudra les refaire respecter côté serveur (ex. règles Supabase) avant la production.
 */

/** Modules dont l'accès se règle par fonction. « Plus » et « Aide & Support » sont toujours accessibles. */
export const configurableModules = [
  { view: 'accueil', label: 'Tableau de bord' },
  { view: 'commandes', label: 'Commandes' },
  { view: 'cuisine', label: 'Cuisine' },
  { view: 'caisse', label: 'Caisse (encaissement)' },
  { view: 'tables', label: 'Tables' },
  { view: 'menu', label: 'Menu' },
  { view: 'stock', label: 'Stock' },
  { view: 'rapports', label: 'Rapports' },
  { view: 'employes', label: 'Employés' },
  { view: 'parametres', label: 'Paramètres et QR codes' },
  { view: 'abonnement', label: 'Abonnement' },
] as const satisfies readonly { view: ManagerView; label: string }[]

export type ConfigurableView = (typeof configurableModules)[number]['view']

export type RolePermissions = {
  views: ConfigurableView[]
  /** Peut prendre une commande (comptoir ou table), même sans accès à l'encaissement. */
  createOrders: boolean
  /** Peut ajouter, modifier et supprimer des plats, et changer leur disponibilité. */
  editMenu: boolean
  /** Module affiché à la connexion. */
  home: ConfigurableView
}

const ALL: ConfigurableView[] = configurableModules.map((m) => m.view)

export const DEFAULT_PERMISSIONS: Record<EmployeeRole, RolePermissions> = {
  gerant: { views: ALL, createOrders: true, editMenu: true, home: 'accueil' },
  chef: { views: ['commandes', 'cuisine', 'menu', 'stock'], createOrders: false, editMenu: true, home: 'cuisine' },
  cuisinier: { views: ['commandes', 'cuisine'], createOrders: false, editMenu: false, home: 'cuisine' },
  serveur: { views: ['commandes', 'tables', 'menu'], createOrders: true, editMenu: false, home: 'commandes' },
  caissier: { views: ['accueil', 'commandes', 'caisse'], createOrders: true, editMenu: false, home: 'caisse' },
  stockiste: { views: ['stock'], createOrders: false, editMenu: false, home: 'stock' },
}

/** Fonctions dont le gérant peut régler les droits (le gérant, lui, a toujours tout). */
export const editableRoles: EmployeeRole[] = ['chef', 'cuisinier', 'serveur', 'caissier', 'stockiste']

// ---------- réglages du gérant (gardés dans le navigateur, comme le reste) ----------

const KEY = 'restoben:permissions:v1'
type Overrides = Partial<Record<EmployeeRole, RolePermissions>>

const EMPTY: Overrides = {}
let cache: Overrides | null = null
const listeners = new Set<() => void>()

function valid(p: unknown): p is RolePermissions {
  const r = p as RolePermissions
  return !!r && Array.isArray(r.views) && r.views.every((v) => ALL.includes(v)) && typeof r.createOrders === 'boolean' && typeof r.editMenu === 'boolean'
}

function read(): Overrides {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Overrides = {}
    for (const role of editableRoles) {
      const p = parsed[role]
      if (valid(p)) out[role] = { ...DEFAULT_PERMISSIONS[role], ...p, home: ALL.includes((p as RolePermissions).home) ? (p as RolePermissions).home : DEFAULT_PERMISSIONS[role].home }
    }
    return out
  } catch {
    return EMPTY
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function onStorage(e: StorageEvent) {
  if (e.key === KEY || e.key === null) {
    cache = null
    emit()
  }
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

const getSnapshot = () => (cache ??= read())
const getServerSnapshot = () => EMPTY

function commit(next: Overrides): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    return false
  }
  cache = next
  emit()
  return true
}

export function usePermissionOverrides(): Overrides {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

onRemoteReset(() => {
  cache = null
  emit()
})

/** Met en place les droits lus dans la base. */
export function applyRemotePermissions(next: Overrides) {
  cache = next
  emit()
}

const toRow = (restaurantId: string, role: EmployeeRole, p: RolePermissions) => ({
  restaurant_id: restaurantId,
  role,
  views: p.views,
  create_orders: p.createOrders,
  edit_menu: p.editMenu,
  home: p.home,
})

export const permissionsActions = {
  set(role: EmployeeRole, permissions: RolePermissions) {
    if (role === 'gerant') return false // le gérant garde tous les droits
    const remote = getRemote()
    if (!remote) return commit({ ...getSnapshot(), [role]: permissions })
    cache = { ...getSnapshot(), [role]: permissions }
    emit()
    background('Enregistrement des droits', () => api.upsertPermissions([toRow(remote.restaurantId, role, permissions)]))
    return true
  },
  reset() {
    const remote = getRemote()
    if (!remote) return commit({})
    cache = {}
    emit()
    // Retour aux droits par défaut : on réécrit les valeurs par défaut (une fonction sans ligne n'aurait aucun accès).
    background('Rétablissement des droits', () => api.upsertPermissions(editableRoles.map((r) => toRow(remote.restaurantId, r, DEFAULT_PERMISSIONS[r]))))
    return true
  },
}

// ---------- calcul de l'accès d'une personne ----------

export type Access = {
  role: EmployeeRole
  views: Set<ManagerView>
  createOrders: boolean
  editMenu: boolean
  home: ManagerView
  /** Encaisser = accès au module Caisse. */
  canCollect: boolean
  /** Le module est-il ouvert à cette personne ? (« Plus » et « Aide » le sont toujours.) */
  canView: (view: ManagerView) => boolean
}

const HOME_FALLBACK: ManagerView[] = ['accueil', 'commandes', 'cuisine', 'caisse', 'stock', 'tables', 'menu', 'aide']

export function accessFor(role: EmployeeRole, overrides: Overrides = {}): Access {
  const base = role === 'gerant' ? DEFAULT_PERMISSIONS.gerant : (overrides[role] ?? DEFAULT_PERMISSIONS[role])
  const views = new Set<ManagerView>([...base.views, 'plus', 'aide'])
  if (views.has('parametres')) views.add('qr') // les QR codes se trouvent dans les paramètres
  const canView = (view: ManagerView) => views.has(view)
  const home = views.has(base.home) ? base.home : (HOME_FALLBACK.find((v) => views.has(v)) ?? 'aide')
  return { role, views, createOrders: base.createOrders, editMenu: base.editMenu, home, canCollect: views.has('caisse'), canView }
}
