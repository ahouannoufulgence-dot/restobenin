export type OrderStatus = 'en_attente' | 'en_cours' | 'pret' | 'terminee' | 'annulee'

export type TableStatus = 'libre' | 'occupee' | 'reservee'

export type RestaurantTable = {
  id: string
  seats: number
  status: TableStatus
}

export type ManagerView = 'accueil' | 'commandes' | 'cuisine' | 'caisse' | 'tables' | 'menu' | 'rapports' | 'plus' | 'parametres' | 'qr' | 'employes'

export const manager = {
  firstName: 'Jean',
  restaurant: 'Restaurant Le Délice',
  city: 'Cotonou',
}

export const initialTables: RestaurantTable[] = [
  { id: 'T1', seats: 2, status: 'libre' },
  { id: 'T2', seats: 2, status: 'libre' },
  { id: 'T3', seats: 4, status: 'libre' },
  { id: 'T4', seats: 2, status: 'libre' },
  { id: 'T5', seats: 4, status: 'libre' },
  { id: 'T6', seats: 4, status: 'libre' },
  { id: 'T7', seats: 4, status: 'libre' },
  { id: 'T8', seats: 4, status: 'libre' },
  { id: 'T9', seats: 4, status: 'libre' },
  { id: 'T10', seats: 6, status: 'reservee' },
  { id: 'T11', seats: 6, status: 'libre' },
  { id: 'T12', seats: 2, status: 'libre' },
]

export const stock = {
  items: 128,
  low: 12,
  threshold: 15,
  value: 1245000,
  alerts: 3,
  movements: [
    { label: 'Entrée – Tomates', when: "Aujourd'hui, 08:15", qty: '+20 kg', direction: 'in' as const },
    { label: 'Sortie – Riz', when: "Aujourd'hui, 07:45", qty: '−10 kg', direction: 'out' as const },
    { label: 'Entrée – Huile', when: 'Hier, 18:30', qty: '+5 L', direction: 'in' as const },
  ],
}

export function fcfa(value: number) {
  return `${value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} FCFA`
}
