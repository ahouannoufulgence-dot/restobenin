'use client'

import { createContext, useContext } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/messages'

const LocaleContext = createContext<{ locale: Locale; messages: Messages } | null>(null)

/** Donne la langue et les textes aux composants du navigateur (le serveur les lit dans le cookie). */
export function LocaleProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  return <LocaleContext.Provider value={{ locale, messages }}>{children}</LocaleContext.Provider>
}

export function useI18n() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useI18n doit être utilisé à l’intérieur de <LocaleProvider>.')
  return value
}
