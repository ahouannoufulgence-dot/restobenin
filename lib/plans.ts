export type PlanId = 'basique' | 'standard' | 'premium'
export type Billing = 'mensuel' | 'annuel'

export type Plan = {
  id: PlanId
  name: string
  tagline: string
  monthly: number
  featured?: boolean
  features: string[]
}

export const ANNUAL_DISCOUNT = 0.2

export const plans: Plan[] = [
  {
    id: 'basique',
    name: 'Basique',
    tagline: 'L’essentiel pour bien démarrer',
    monthly: 15000,
    features: ['Commandes & Paiements', 'Gestion des stocks basique', 'Équipe (jusqu’à 5 membres)', 'Rapports journaliers', 'Support email'],
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'L’équilibre parfait pour grandir',
    monthly: 25000,
    featured: true,
    features: [
      'Tout du Basique',
      'Stocks avancés & alertes',
      'Équipe (jusqu’à 15 membres)',
      'Analytics & performances',
      'Avis clients & réputation',
      'Support prioritaire',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'L’expérience ultime',
    monthly: 45000,
    features: [
      'Tout du Standard',
      'Gestion multi-restaurants',
      'Équipe illimitée',
      'Analytics avancées & prédictives',
      'Intégrations & API',
      'Support dédié 7j/7',
    ],
  },
]

/** Nombre maximal de membres d'équipe selon la formule (null = illimité). */
export const teamLimits: Record<PlanId, number | null> = { basique: 5, standard: 15, premium: null }

export function isPlanId(value: unknown): value is PlanId {
  return plans.some((plan) => plan.id === value)
}

export function getPlan(id: PlanId): Plan {
  return plans.find((plan) => plan.id === id) ?? plans[1]
}

export function monthlyPrice(plan: Plan, billing: Billing) {
  return billing === 'annuel' ? Math.round(plan.monthly * (1 - ANNUAL_DISCOUNT)) : plan.monthly
}

export function amountDue(plan: Plan, billing: Billing) {
  return billing === 'annuel' ? monthlyPrice(plan, billing) * 12 : plan.monthly
}

const fcfaFormatter = new Intl.NumberFormat('fr-FR')

export function formatFCFA(value: number) {
  return fcfaFormatter.format(value)
}
