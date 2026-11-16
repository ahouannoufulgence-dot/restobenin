'use client'

import { useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'
import { useI18n } from '@/components/i18n/locale-provider'
import { Logo } from './logo'

const navItems = [
  { key: 'solutions', href: '/#solutions', hasMenu: true },
  { key: 'features', href: '/#fonctionnalites' },
  { key: 'resources', href: '/#ressources', hasMenu: true },
  { key: 'about', href: '/#a-propos' },
  { key: 'contact', href: '/#contact' },
] as const

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { messages } = useI18n()
  const h = messages.header

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-10">
        <Logo href="/" tagline={messages.logo.tagline} label={messages.logo.label} />

        <nav aria-label={h.mainNav} className="hidden lg:block">
          <ul className="flex items-center gap-7 xl:gap-9">
            {navItems.map((item) => (
              <li key={item.key}>
                <a
                  href={item.href}
                  className="flex items-center gap-1 whitespace-nowrap text-xs font-medium uppercase tracking-[0.14em] text-cream/90 transition-colors hover:text-ember"
                >
                  {h.nav[item.key]}
                  {'hasMenu' in item && item.hasMenu && <ChevronDown className="size-3.5" aria-hidden="true" />}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher />
          <a href="/connexion" className="whitespace-nowrap text-sm font-medium text-cream/90 transition-colors hover:text-ember">
            {h.login}
          </a>
          <a
            href="/inscription"
            className="whitespace-nowrap rounded-md bg-ember px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-ember/30 transition-colors hover:bg-ember-deep"
          >
            {h.signup}
          </a>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-cream lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? h.closeMenu : h.openMenu}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label={h.mobileNav} className="mx-4 rounded-xl border border-cream/10 bg-espresso/95 p-4 backdrop-blur-lg lg:hidden">
          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.key}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-sm font-medium uppercase tracking-[0.14em] text-cream/90"
                >
                  {h.nav[item.key]}
                </a>
              </li>
            ))}
          </ul>
          <LanguageSwitcher variant="inline" />
          <a href="/connexion" onClick={() => setOpen(false)} className="mt-2 block py-3 text-sm font-medium uppercase tracking-[0.14em] text-cream/90">
            {h.login}
          </a>
          <a
            href="/inscription"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-md bg-ember px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
          >
            {h.signup}
          </a>
        </nav>
      )}
    </header>
  )
}
