import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, isLocale } from './config'
import { getDictionary } from './index'

/** Langue choisie par le visiteur (cookie) ; français par défaut. Réservé aux composants serveur. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export async function getMessages() {
  return getDictionary(await getLocale())
}
