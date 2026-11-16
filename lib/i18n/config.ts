export const LOCALES = ['fr', 'en', 'fon'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'fr'
export const LOCALE_COOKIE = 'locale'

export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

/** `short` : code affiché dans le bouton ; `long` : nom dans le menu (chaque langue s'écrit dans sa propre langue). */
export const LOCALE_NAMES: Record<Locale, { short: string; long: string }> = {
  fr: { short: 'FR', long: 'Français' },
  en: { short: 'EN', long: 'English' },
  fon: { short: 'FON', long: 'Fɔngbè (bêta)' },
}

/** Remplace {nom} par sa valeur dans un texte : fmt('Choisir {name}', { name: 'Standard' }). */
export const fmt = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''))
