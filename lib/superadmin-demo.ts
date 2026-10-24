/** Données FICTIVES de l'espace Super Admin (maquette). Aucune ne correspond à un vrai restaurant. */

export type Plan = 'Standard' | 'Premium'
export type RestaurantStatus = 'Actif' | 'Suspendu'

export type DemoRestaurant = {
  id: string
  name: string
  city: string
  plan: Plan
  status: RestaurantStatus
  /** Nombre de jours écoulés depuis l'inscription (pour rester d'actualité). */
  daysAgo: number
  owner: string
  tables: number
  monthlyRevenue: number
}

export const demoRestaurants: DemoRestaurant[] = [
  { id: 'r1', name: 'Chez Amina', city: 'Cotonou', plan: 'Standard', status: 'Actif', daysAgo: 3, owner: 'Amina Diallo', tables: 12, monthlyRevenue: 2_850_000 },
  { id: 'r2', name: 'Le Palmier', city: 'Porto-Novo', plan: 'Premium', status: 'Actif', daysAgo: 4, owner: 'Koffi Mensah', tables: 20, monthlyRevenue: 5_120_000 },
  { id: 'r3', name: 'Saveurs du Bénin', city: 'Parakou', plan: 'Standard', status: 'Suspendu', daysAgo: 8, owner: 'Fatou Bamba', tables: 9, monthlyRevenue: 0 },
  { id: 'r4', name: 'Le Grill d’Or', city: 'Cotonou', plan: 'Premium', status: 'Actif', daysAgo: 10, owner: 'Rodrigue Gbaguidi', tables: 16, monthlyRevenue: 4_380_000 },
  { id: 'r5', name: 'Maquis 229', city: 'Abomey-Calavi', plan: 'Standard', status: 'Actif', daysAgo: 13, owner: 'Sènami Hounkpatin', tables: 14, monthlyRevenue: 1_940_000 },
]

export const demoKpis = {
  restaurants: 847,
  activeSubscriptions: 792,
  monthlyRevenue: 19_800_000,
  newThisMonth: 64,
  openTickets: 12,
}

/** Inscriptions par mois sur les 12 derniers mois (le dernier = mois en cours). */
export const demoSignups12 = [4, 6, 9, 11, 15, 25, 37, 36, 53, 47, 58, 64]

export const periodOptions = [
  { value: 3, label: '3 derniers mois' },
  { value: 7, label: '7 derniers mois' },
  { value: 12, label: '12 derniers mois' },
] as const

export function signupSeries(months: number, now = new Date()) {
  const values = demoSignups12.slice(-months)
  return values.map((value, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const label = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
    return { label: label.charAt(0).toUpperCase() + label.slice(1), value }
  })
}

export const sections = [
  { slug: 'restaurants', label: 'Restaurants', description: 'La liste complète des restaurants, leurs fiches et leur statut.' },
  { slug: 'abonnements', label: 'Abonnements', description: 'Formules, renouvellements, essais et résiliations.' },
  { slug: 'paiements', label: 'Paiements', description: 'Encaissements des abonnements et factures.' },
  { slug: 'support', label: 'Support', description: 'Tickets ouverts par les restaurateurs.' },
  { slug: 'utilisateurs', label: 'Utilisateurs', description: 'Comptes gérants et employés de tous les restaurants.' },
  { slug: 'parametres', label: 'Paramètres', description: 'Formules, tarifs et réglages de la plateforme.' },
] as const

export type SectionSlug = (typeof sections)[number]['slug']
