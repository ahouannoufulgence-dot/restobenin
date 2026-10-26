export type Category = 'plats' | 'boissons' | 'desserts'

export type Review = { author: string; date: string; rating: number; text: string }

export type ClientDish = {
  id: string
  name: string
  description: string
  price: number
  category: Category
  image?: string
  rating: number
  reviewCount: number
  available: boolean
  reviews: Review[]
}

export const restaurant = { name: 'Le Délice', city: 'Cotonou' }

export const SERVICE_FEE = 500

export const categories: { id: Category | 'tous'; label: string }[] = [
  { id: 'tous', label: 'Tous' },
  { id: 'plats', label: 'Plats' },
  { id: 'boissons', label: 'Boissons' },
  { id: 'desserts', label: 'Desserts' },
]

export const catalog: ClientDish[] = [
  {
    id: 'd-yassa',
    name: 'Poulet Yassa',
    description: 'Poulet mariné au citron et aux oignons confits, grillé puis mijoté. Servi avec du riz blanc.',
    price: 3500,
    category: 'plats',
    image: '/images/gerant/poulet-yassa.webp',
    rating: 4.7,
    reviewCount: 128,
    available: true,
    reviews: [
      { author: 'Aminata D.', date: '12/10/2026', rating: 5, text: 'Délicieux ! Le poulet est bien assaisonné et très tendre.' },
      { author: 'Yacouba T.', date: '11/10/2026', rating: 5, text: 'Excellent, je recommande à 100 %. Le meilleur yassa de Cotonou.' },
    ],
  },
  {
    id: 'd-riz',
    name: 'Riz au Poisson',
    description: 'Riz parfumé cuit dans un bouillon de tomates et d’épices, accompagné de poisson frais.',
    price: 3000,
    category: 'plats',
    image: '/images/gerant/riz-poisson.webp',
    rating: 4.5,
    reviewCount: 96,
    available: true,
    reviews: [
      { author: 'Koffi A.', date: '10/10/2026', rating: 4, text: 'Très bon riz, le poisson est frais. Portion généreuse.' },
      { author: 'Sènami H.', date: '08/10/2026', rating: 5, text: 'Un classique parfaitement réalisé.' },
    ],
  },
  {
    id: 'd-mafe',
    name: 'Mafé Bœuf',
    description: 'Bœuf mijoté dans une sauce onctueuse à la pâte d’arachide, servi avec du riz.',
    price: 3800,
    category: 'plats',
    image: '/images/gerant/mafe-boeuf.webp',
    rating: 4.8,
    reviewCount: 74,
    available: true,
    reviews: [
      { author: 'Fatoumata B.', date: '09/10/2026', rating: 5, text: 'Sauce très onctueuse, viande fondante. Un régal.' },
      { author: 'Ibrahim S.', date: '05/10/2026', rating: 5, text: 'Le meilleur plat de la carte, sans hésiter.' },
    ],
  },
  {
    id: 'd-akassa',
    name: 'Akassa sauce poisson',
    description: 'Pâte de maïs fermentée, servie avec une sauce au poisson relevée.',
    price: 1500,
    category: 'plats',
    image: '/images/gerant/akassa.webp',
    rating: 4.4,
    reviewCount: 52,
    available: false,
    reviews: [{ author: 'Rodrigue G.', date: '02/10/2026', rating: 4, text: 'Une sauce bien relevée, comme à la maison.' }],
  },
  {
    id: 'd-bissap',
    name: 'Jus de bissap',
    description: 'Infusion glacée de fleurs d’hibiscus, légèrement sucrée et parfumée à la menthe.',
    price: 1000,
    category: 'boissons',
    rating: 4.6,
    reviewCount: 88,
    available: true,
    reviews: [{ author: 'Aminata D.', date: '12/10/2026', rating: 5, text: 'Bien frais, parfait avec un plat épicé.' }],
  },
  {
    id: 'd-gingembre',
    name: 'Jus de gingembre',
    description: 'Gingembre frais pressé, citron et une pointe de miel. Piquant et rafraîchissant.',
    price: 1000,
    category: 'boissons',
    rating: 4.5,
    reviewCount: 61,
    available: true,
    reviews: [{ author: 'Yacouba T.', date: '07/10/2026', rating: 4, text: 'Bien piquant, exactement comme je l’aime.' }],
  },
  {
    id: 'd-eau',
    name: 'Eau minérale',
    description: 'Bouteille d’eau minérale fraîche, 50 cl.',
    price: 500,
    category: 'boissons',
    rating: 4.2,
    reviewCount: 20,
    available: true,
    reviews: [],
  },
  {
    id: 'd-tiramisu',
    name: 'Tiramisu spécial',
    description: 'Biscuits imbibés de café, crème mascarpone légère et cacao amer.',
    price: 2500,
    category: 'desserts',
    image: '/images/gerant/tiramisu.webp',
    rating: 4.9,
    reviewCount: 43,
    available: true,
    reviews: [{ author: 'Sènami H.', date: '11/10/2026', rating: 5, text: 'Léger et gourmand, le dessert parfait.' }],
  },
]

export type OrderLine = { id: string; name: string; qty: number; price: number }

export type PlacedOrder = {
  number: string
  lines: OrderLine[]
  subtotal: number
  total: number
  stage: number // 0 reçue, 1 en préparation, 2 prête, 3 servie
  times: number[] // horodatage de chaque étape atteinte
  cancelled?: boolean
}

export const stages = [
  { title: 'Commande reçue', detail: 'Votre commande a été confirmée.' },
  { title: 'En préparation', detail: 'Votre commande est en cours de préparation.' },
  { title: 'Prête', detail: 'Votre commande est prête à être servie.' },
  { title: 'Servie', detail: 'Votre commande a été servie à votre table.' },
]
