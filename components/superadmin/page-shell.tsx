'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Banknote, Building2, CalendarDays, ChevronDown, CreditCard, Flame, Headset, House, LogOut, Menu, Settings, TriangleAlert, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEMO_SUPERADMIN, getSuperAdminSession, signOutSuperAdmin } from '@/lib/superadmin-auth'

export type NavKey = 'dashboard' | 'restaurants' | 'abonnements' | 'paiements' | 'support' | 'utilisateurs' | 'parametres'

const nav: { key: NavKey; label: string; href: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: 'Tableau de bord', href: '/superadmin', icon: House },
  { key: 'restaurants', label: 'Restaurants', href: '/superadmin/restaurants', icon: Building2 },
  { key: 'abonnements', label: 'Abonnements', href: '/superadmin/abonnements', icon: CreditCard },
  { key: 'paiements', label: 'Paiements', href: '/superadmin/paiements', icon: Banknote },
  { key: 'support', label: 'Support', href: '/superadmin/support', icon: Headset },
  { key: 'utilisateurs', label: 'Utilisateurs', href: '/superadmin/utilisateurs', icon: Users },
  { key: 'parametres', label: 'Paramètres', href: '/superadmin/parametres', icon: Settings },
]

function Brand() {
  return (
    <Link href="/superadmin" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold/50" aria-label="RestoBen Super Admin, tableau de bord">
      <Flame className="size-9 fill-ember/40 text-ember" strokeWidth={1.6} aria-hidden="true" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-2xl font-semibold text-cream">RestoBen</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">Super Admin</span>
      </span>
    </Link>
  )
}

function NavList({ current, onNavigate, onLogout }: { current: NavKey; onNavigate?: () => void; onLogout: () => void }) {
  return (
    <>
      <nav aria-label="Navigation Super Admin" className="mt-8">
        <ul className="flex flex-col gap-1.5">
          {nav.map(({ key, label, href, icon: Icon }) => (
            <li key={key}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={current === key ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold/50',
                  current === key ? 'bg-ember-deep text-white' : 'text-cream/85 hover:bg-cream/10 hover:text-cream',
                )}
              >
                <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <button
        type="button"
        onClick={onLogout}
        className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium text-cream/85 hover:bg-cream/10 hover:text-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold/50"
      >
        <LogOut className="size-5" strokeWidth={1.7} aria-hidden="true" />
        Déconnexion
      </button>
    </>
  )
}

/** Coque de toutes les pages du Super Admin : accès, menu latéral, titre, date et profil. */
export function SuperAdminPage({ title, current, children }: { title: string; current: NavKey; children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [identifier, setIdentifier] = useState('Super Admin')
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const [today, setToday] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void getSuperAdminSession().then((session) => {
      if (cancelled) return
      if (!session) {
        router.replace('/superadmin/connexion')
        return
      }
      setIdentifier(session.identifier)
      const d = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      setToday(d.charAt(0).toUpperCase() + d.slice(1))
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  function logout() {
    signOutSuperAdmin()
    router.replace('/superadmin/connexion')
  }

  if (!ready) return null

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-[#3a1b0f] px-4 py-7 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <NavList current={current} onLogout={logout} />
      </aside>

      {/* Barre du haut (téléphone et tablette) */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[#3a1b0f] px-4 py-3 lg:hidden">
        <Brand />
        <button type="button" onClick={() => setDrawer(true)} aria-label="Ouvrir le menu" className="inline-flex size-11 items-center justify-center rounded-lg text-cream hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold/50">
          <Menu className="size-6" aria-hidden="true" />
        </button>
      </header>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu Super Admin">
          <button type="button" className="absolute inset-0 bg-espresso/60" onClick={() => setDrawer(false)} aria-label="Fermer le menu" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[#3a1b0f] px-4 py-6">
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button type="button" onClick={() => setDrawer(false)} aria-label="Fermer" className="inline-flex size-10 items-center justify-center rounded-lg text-cream hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold/50">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <NavList current={current} onNavigate={() => setDrawer(false)} onLogout={logout} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 pb-12">
        {DEMO_SUPERADMIN && (
          <p className="flex items-center justify-center gap-2 bg-gold/20 px-4 py-2 text-center text-xs text-[#6b4510]">
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            Maquette : données fictives, accès non protégé.
          </p>
        )}
        <div className="mx-auto max-w-[78rem] px-4 pt-6 sm:px-6 lg:px-10 lg:pt-9">
          <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div>
              <h1 className="font-serif text-3xl font-semibold leading-tight text-balance sm:text-4xl 2xl:text-5xl">{title}</h1>
              <span className="mt-2 block h-0.5 w-14 bg-ember" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-5">
              <p className="hidden items-center gap-2 text-sm sm:flex">
                <CalendarDays className="size-5 text-ember-deep" strokeWidth={1.6} aria-hidden="true" />
                {today}
              </p>
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenu((m) => !m)}
                  aria-haspopup="true"
                  aria-expanded={menu}
                  className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 text-left hover:bg-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-ember-deep font-serif text-lg font-semibold text-white" aria-hidden="true">
                    {identifier.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden leading-tight sm:block">
                    <span className="block max-w-36 truncate text-sm font-semibold">{identifier}</span>
                    <span className="text-xs text-muted-foreground">Administrateur</span>
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>
                {menu && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                    <button type="button" onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-ember/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                      <LogOut className="size-4" aria-hidden="true" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  )
}
