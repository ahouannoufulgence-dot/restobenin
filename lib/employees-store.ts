import { useSyncExternalStore } from 'react'

/**
 * Équipe du restaurant (module « Employés » de l'espace gérant).
 *
 * Comme le menu et les commandes, les employés sont gardés dans le navigateur (localStorage) en
 * attendant la base de données. Pour passer à Supabase, il suffira de remplacer `read` et `commit`
 * par des appels à la base : le reste de l'application ne change pas.
 *
 * Aucun mot de passe n'est stocké ici : la vérification des comptes employés viendra de
 * l'authentification réelle (voir `lib/auth.ts`).
 */

export type EmployeeRole = 'gerant' | 'chef' | 'cuisinier' | 'serveur' | 'caissier' | 'stockiste'
export type EmployeeStatus = 'actif' | 'conge'

export type Employee = {
  id: string
  name: string
  role: EmployeeRole
  phone: string
  email: string
  status: EmployeeStatus
  /** Photo réduite (data URL), facultative : sinon on affiche les initiales. */
  photo?: string
}

export const roleLabels: Record<EmployeeRole, string> = {
  gerant: 'Gérant',
  chef: 'Chef de cuisine',
  cuisinier: 'Cuisinier',
  serveur: 'Serveur',
  caissier: 'Caissier',
  stockiste: 'Stockiste',
}

export const roleOrder = Object.keys(roleLabels) as EmployeeRole[]

export const statusLabels: Record<EmployeeStatus, string> = { actif: 'Actif', conge: 'En congé' }

/** Chiffres significatifs d'un numéro béninois : les 8 derniers (fonctionne avec ou sans « 01 » et « +229 »). */
export const phoneKey = (value: string) => value.replace(/\D/g, '').slice(-8)

export const normalizeEmail = (value: string) => value.trim().toLowerCase()

const KEY = 'restoben:employees:v1'

// Données de démonstration (personnes fictives).
const SEED: Employee[] = [
  { id: 'e-1', name: 'Jean Kouassi', role: 'gerant', phone: '+229 01 97 12 34 56', email: 'jean.kouassi@restoben.bj', status: 'actif' },
  { id: 'e-2', name: 'Amina Diallo', role: 'chef', phone: '+229 01 95 22 33 44', email: 'amina.diallo@restoben.bj', status: 'actif' },
  { id: 'e-3', name: 'Koffi Mensah', role: 'serveur', phone: '+229 01 93 45 67 89', email: 'koffi.mensah@restoben.bj', status: 'actif' },
  { id: 'e-4', name: 'Fatou Bamba', role: 'stockiste', phone: '+229 01 91 78 90 12', email: 'fatou.bamba@restoben.bj', status: 'conge' },
  { id: 'e-5', name: 'Codjo Houngbo', role: 'cuisinier', phone: '+229 01 96 10 20 30', email: 'codjo.houngbo@restoben.bj', status: 'actif' },
  { id: 'e-6', name: 'Rachida Adjovi', role: 'caissier', phone: '+229 01 94 55 66 77', email: 'rachida.adjovi@restoben.bj', status: 'actif' },
  { id: 'e-7', name: 'Arnaud Dossou', role: 'serveur', phone: '+229 01 97 81 82 83', email: 'arnaud.dossou@restoben.bj', status: 'actif' },
  { id: 'e-8', name: 'Judith Tossou', role: 'serveur', phone: '+229 01 95 90 91 92', email: 'judith.tossou@restoben.bj', status: 'actif' },
  { id: 'e-9', name: 'Moussa Zinsou', role: 'cuisinier', phone: '+229 01 92 13 14 15', email: 'moussa.zinsou@restoben.bj', status: 'actif' },
  { id: 'e-10', name: 'Estelle Gbaguidi', role: 'serveur', phone: '+229 01 96 41 42 43', email: 'estelle.gbaguidi@restoben.bj', status: 'conge' },
  { id: 'e-11', name: 'Prince Kpadonou', role: 'cuisinier', phone: '+229 01 93 71 72 73', email: 'prince.kpadonou@restoben.bj', status: 'actif' },
  { id: 'e-12', name: 'Sènami Agbo', role: 'caissier', phone: '+229 01 94 31 32 33', email: 'senami.agbo@restoben.bj', status: 'actif' },
]

let cache: Employee[] | null = null
const listeners = new Set<() => void>()

function isEmployees(value: unknown): value is Employee[] {
  return (
    Array.isArray(value) &&
    value.every(
      (e) =>
        e &&
        typeof e.id === 'string' &&
        typeof e.name === 'string' &&
        typeof e.email === 'string' &&
        typeof e.phone === 'string' &&
        e.role in roleLabels &&
        e.status in statusLabels,
    )
  )
}

function read(): Employee[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return SEED
    const parsed: unknown = JSON.parse(raw)
    return isEmployees(parsed) ? parsed : SEED
  } catch {
    return SEED
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

function getSnapshot() {
  if (!cache) cache = read()
  return cache
}

function getServerSnapshot() {
  return SEED
}

/** Enregistre la nouvelle liste. Renvoie false si le navigateur n'a plus de place. */
function commit(next: Employee[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    return false
  }
  cache = next
  emit()
  return true
}

export function useEmployees(): Employee[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Retrouve un employé par e-mail ou par téléphone (utilisé par la connexion « Employé »). */
export function findEmployee(identifier: string): Employee | undefined {
  const value = identifier.trim()
  if (!value) return undefined
  if (value.includes('@')) {
    const email = normalizeEmail(value)
    return getSnapshot().find((e) => normalizeEmail(e.email) === email)
  }
  const key = phoneKey(value)
  return key.length === 8 ? getSnapshot().find((e) => phoneKey(e.phone) === key) : undefined
}

export const employeesActions = {
  /** Ajoute l'employé, ou met à jour celui qui a le même id. */
  save(employee: Employee) {
    const list = getSnapshot()
    const exists = list.some((e) => e.id === employee.id)
    return commit(exists ? list.map((e) => (e.id === employee.id ? employee : e)) : [...list, employee])
  },
  remove(id: string) {
    return commit(getSnapshot().filter((e) => e.id !== id))
  },
  newId() {
    return `e-${Date.now().toString(36)}`
  },
}
