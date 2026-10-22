export type OrderStatus = 'en_attente' | 'en_cours' | 'pret' | 'terminee' | 'annulee'

export type Order = {
  id: string
  table: string
  time: string
  amount: number
  items: number
  status: OrderStatus
}

export type TableStatus = 'libre' | 'occupee' | 'reservee'

export type RestaurantTable = {
  id: string
  seats: number
  status: TableStatus
}

export type ManagerView = 'accueil' | 'commandes' | 'tables' | 'menu' | 'rapports' | 'plus'

export const manager = {
  firstName: 'Jean',
  restaurant: 'Restaurant Le Délice',
  city: 'Cotonou',
}

export const initialOrders: Order[] = [
  { id: 'c-1012', table: 'Table 12', time: '12:45', amount: 18750, items: 3, status: 'en_cours' },
  { id: 'c-1005', table: 'Table 05', time: '12:38', amount: 9250, items: 2, status: 'en_attente' },
  { id: 'c-1003', table: 'Table 03', time: '12:30', amount: 24500, items: 4, status: 'pret' },
  { id: 'c-1008', table: 'Table 08', time: '12:22', amount: 15300, items: 3, status: 'en_cours' },
  { id: 'c-1001', table: 'Table 01', time: '12:15', amount: 7800, items: 1, status: 'en_attente' },
  { id: 'c-1009', table: 'Table 09', time: '12:10', amount: 12600, items: 2, status: 'pret' },
  { id: 'c-1011', table: 'Table 11', time: '12:02', amount: 21400, items: 5, status: 'en_cours' },
  { id: 'c-0998', table: 'Table 04', time: '11:40', amount: 16800, items: 3, status: 'terminee' },
  { id: 'c-0995', table: 'Table 02', time: '11:25', amount: 6500, items: 2, status: 'terminee' },
  { id: 'c-0990', table: 'Table 07', time: '11:05', amount: 31200, items: 6, status: 'terminee' },
  { id: 'c-0987', table: 'Table 06', time: '10:50', amount: 4500, items: 1, status: 'annulee' },
]

export const initialTables: RestaurantTable[] = [
  { id: 'T1', seats: 2, status: 'libre' },
  { id: 'T2', seats: 2, status: 'libre' },
  { id: 'T3', seats: 4, status: 'occupee' },
  { id: 'T4', seats: 2, status: 'libre' },
  { id: 'T5', seats: 4, status: 'occupee' },
  { id: 'T6', seats: 4, status: 'occupee' },
  { id: 'T7', seats: 4, status: 'occupee' },
  { id: 'T8', seats: 4, status: 'reservee' },
  { id: 'T9', seats: 4, status: 'occupee' },
  { id: 'T10', seats: 6, status: 'libre' },
  { id: 'T11', seats: 6, status: 'occupee' },
  { id: 'T12', seats: 2, status: 'occupee' },
]

export const salesToday = {
  total: 412500,
  change: 12,
  points: [12, 18, 15, 26, 22, 34, 30, 41, 37, 48, 44, 58],
}

export const weeklyReport = {
  range: '20 mai – 26 mai 2026',
  revenue: 2850000,
  revenueChange: 12,
  orders: 187,
  ordersChange: 8,
  satisfaction: 4.7,
  topDish: { name: 'Poulet Yassa', orders: 65 },
  averageBasket: 4320,
  basketChange: 9,
  days: [
    { day: 'Lun', value: 320000 },
    { day: 'Mar', value: 410000 },
    { day: 'Mer', value: 360000 },
    { day: 'Jeu', value: 470000 },
    { day: 'Ven', value: 380000 },
    { day: 'Sam', value: 450000 },
    { day: 'Dim', value: 460000 },
  ],
  topDishes: [
    { name: 'Poulet Yassa', orders: 65, revenue: 227500 },
    { name: 'Mafé Bœuf', orders: 48, revenue: 182400 },
    { name: 'Riz au Poisson', orders: 41, revenue: 123000 },
    { name: 'Akassa sauce poisson', orders: 33, revenue: 49500 },
  ],
}

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
