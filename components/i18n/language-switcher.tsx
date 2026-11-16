'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, type Locale, fmt } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'
import { useI18n } from './locale-provider'

/**
 * Changement de langue. Le choix est gardé dans un cookie (un an) : le serveur affiche ensuite la page directement dans cette langue.
 *  - « menu » : bouton avec liste déroulante (en-tête du site sur ordinateur)
 *  - « inline » : trois boutons côte à côte (menu mobile)
 */
export function LanguageSwitcher({ variant = 'menu' }: { variant?: 'menu' | 'inline' }) {
  const { locale, messages } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function choose(next: Locale) {
    setOpen(false)
    if (next === locale) return
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next
    startTransition(() => router.refresh())
  }

  if (variant === 'inline') {
    return (
      <div role="group" aria-label={messages.header.languageLabel} className="mt-3 grid grid-cols-3 gap-2">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={l === locale}
            onClick={() => choose(l)}
            className={cn(
              'rounded-md border px-2 py-2.5 text-xs font-semibold transition-colors',
              l === locale ? 'border-gold bg-gold/15 text-gold' : 'border-cream/20 text-cream/90 hover:border-gold/60',
            )}
          >
            {LOCALE_NAMES[l].long}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        aria-label={fmt(messages.header.changeLanguage, { name: LOCALE_NAMES[locale].long })}
        className="flex items-center gap-2 rounded-md border border-cream/20 px-3 py-2 text-xs font-medium text-cream transition-colors hover:border-gold/60"
      >
        <Globe className="size-4" aria-hidden="true" />
        {LOCALE_NAMES[locale].short}
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <ul role="menu" aria-label={messages.header.languageLabel} className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-md border border-cream/15 bg-espresso/95 py-1 shadow-xl backdrop-blur-lg">
          {LOCALES.map((l) => (
            <li key={l} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={l === locale}
                lang={l}
                onClick={() => choose(l)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-cream/90 transition-colors hover:bg-cream/10 hover:text-gold"
              >
                {LOCALE_NAMES[l].long}
                {l === locale && <Check className="size-4 text-gold" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
