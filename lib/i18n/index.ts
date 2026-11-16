import { type Locale } from './config'
import { en } from './en'
import { fon } from './fon'
import { fr } from './fr'
import type { DeepPartial, Messages } from './messages'

/** Superpose une traduction partielle au français : tout ce qui n'est pas traduit reste en français. */
function merge<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (override === undefined || override === null) return base
  if (Array.isArray(base)) {
    const list = override as unknown[]
    return base.map((item, i) => merge(item, list[i] as DeepPartial<typeof item>)) as unknown as T
  }
  if (base && typeof base === 'object') {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
    for (const key of Object.keys(override as object)) {
      out[key] = merge((base as Record<string, unknown>)[key], (override as Record<string, unknown>)[key] as never)
    }
    return out as T
  }
  return override as T
}

const dictionaries: Record<Locale, Messages> = {
  fr,
  en,
  fon: merge(fr, fon),
}

export const getDictionary = (locale: Locale): Messages => dictionaries[locale]
export type { Messages } from './messages'
