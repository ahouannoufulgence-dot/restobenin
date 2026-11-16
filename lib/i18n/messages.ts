import type { PlanId } from '@/lib/plans'

/** Tous les textes de la page d'accueil. Pas de fonctions ici : ces textes passent du serveur au navigateur. */
export type Messages = {
  meta: { title: string; description: string }
  logo: { tagline: string; label: string }
  header: {
    nav: { solutions: string; features: string; resources: string; about: string; contact: string }
    login: string
    signup: string
    mainNav: string
    mobileNav: string
    openMenu: string
    closeMenu: string
    /** {name} : nom de la langue actuelle */
    changeLanguage: string
    languageLabel: string
  }
  hero: {
    titleStart: string
    titleEm: string
    text: string
    ctaPrimary: string
    ctaSecondary: string
    rating: string
    ratingText: string
    features: { title: string; text: string }[]
  }
  trust: { title: string }
  pricing: {
    title: string
    subtitle: string
    featured: string
    perMonth: string
    /** {name} : nom de la formule */
    choose: string
    plans: Record<PlanId, { name: string; tagline: string; features: string[] }>
  }
  footer: {
    tagline: string
    columns: { title: string; links: string[] }[]
    contact: string
    address: string
    /** {year} : année en cours */
    rights: string
    legal: { notice: string; privacy: string; terms: string }
    admin: string
  }
}

export type DeepPartial<T> = T extends (infer U)[] ? DeepPartial<U>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T
