'use client'

import { useState } from 'react'
import { ChevronDown, Globe, Menu, X } from 'lucide-react'
import { Logo } from './logo'

const navItems = [
  { label: 'Solutions', href: '/#solutions', hasMenu: true },
  { label: 'Fonctionnalités', href: '/#fonctionnalites' },
  { label: 'Ressources', href: '/#ressources', hasMenu: true },
  { label: 'À propos', href: '/#a-propos' },
  { label: 'Contact', href: '/#contact' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-10">
        <Logo href="/" />

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-7 xl:gap-9">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="flex items-center gap-1 whitespace-nowrap text-xs font-medium uppercase tracking-[0.14em] text-cream/90 transition-colors hover:text-ember"
                >
                  {item.label}
                  {item.hasMenu && <ChevronDown className="size-3.5" aria-hidden="true" />}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-cream/20 px-3 py-2 text-xs font-medium text-cream transition-colors hover:border-gold/60"
            aria-label="Changer de langue, langue actuelle : français"
          >
            <Globe className="size-4" aria-hidden="true" />
            FR
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
          <a href="/connexion" className="whitespace-nowrap text-sm font-medium text-cream/90 transition-colors hover:text-ember">
            Se connecter
          </a>
          <a
            href="/inscription"
            className="whitespace-nowrap rounded-md bg-ember px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-ember/30 transition-colors hover:bg-ember-deep"
          >
            Inscrire mon restaurant
          </a>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-cream lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Navigation mobile" className="mx-4 rounded-xl border border-cream/10 bg-espresso/95 p-4 backdrop-blur-lg lg:hidden">
          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-sm font-medium uppercase tracking-[0.14em] text-cream/90"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="/connexion" onClick={() => setOpen(false)} className="mt-2 block py-3 text-sm font-medium uppercase tracking-[0.14em] text-cream/90">
            Se connecter
          </a>
          <a
            href="/inscription"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-md bg-ember px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
          >
            Inscrire mon restaurant
          </a>
        </nav>
      )}
    </header>
  )
}
