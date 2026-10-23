'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Eye, EyeOff, Flame, Lock, Mail, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEMO_AUTH, MIN_PASSWORD, isValidIdentifier, signIn, type Role } from '@/lib/auth'
import { legal } from '@/lib/legal-info'

const fieldBase =
  'flex h-14 items-center gap-3 rounded-xl border bg-card/90 px-4 shadow-sm transition-colors focus-within:border-ember focus-within:ring-3 focus-within:ring-ember/20'

const tabs: { role: Role; label: string }[] = [
  { role: 'gerant', label: 'Gérant' },
  { role: 'employe', label: 'Employé' },
]

export function LoginForm() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('gerant')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; form?: string }>({})
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const identifierRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function chooseRole(next: Role) {
    setRole(next)
    setErrors({})
    setInfo('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setInfo('')
    const next: typeof errors = {}
    if (!identifier.trim()) next.identifier = 'Indiquez votre adresse e-mail ou votre téléphone.'
    else if (!isValidIdentifier(identifier)) next.identifier = 'Saisissez une adresse e-mail ou un numéro de téléphone valide.'
    if (!password) next.password = 'Indiquez votre mot de passe.'
    else if (password.length < MIN_PASSWORD) next.password = `Le mot de passe contient au moins ${MIN_PASSWORD} caractères.`
    setErrors(next)
    if (next.identifier) return identifierRef.current?.focus()
    if (next.password) return passwordRef.current?.focus()

    setBusy(true)
    const result = await signIn(identifier, password, remember, role)
    if (!result.ok) {
      setBusy(false)
      return setErrors({ form: result.error })
    }
    router.push('/gerant')
  }

  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Bandeau photo + marque */}
      <section className="relative isolate flex min-h-[23rem] flex-col items-center justify-center overflow-hidden bg-espresso px-6 pb-20 pt-14 text-center text-cream sm:min-h-[26rem] lg:min-h-dvh lg:pb-14">
        <Image src="/images/hero-restaurant.png" alt="" fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="-z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-espresso/75 via-espresso/45 to-espresso/90" aria-hidden="true" />

        <Link href="/" aria-label="RestoBen, retour à l’accueil" className="flex flex-col items-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold/50">
          <Flame className="size-14 fill-ember/60 text-ember drop-shadow-lg" strokeWidth={1.5} aria-hidden="true" />
          <span className="mt-1 font-serif text-6xl font-semibold leading-none tracking-tight sm:text-7xl">
            Resto<span className="text-ember">Ben</span>
          </span>
        </Link>

        <div className="mt-4 flex w-full max-w-sm items-center gap-3 text-gold" aria-hidden="true">
          <span className="h-px flex-1 bg-gold/60" />
          <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.2em] sm:text-xs">La gestion élevée au goût près</span>
          <span className="h-px flex-1 bg-gold/60" />
        </div>
        <p className="sr-only">La gestion élevée au goût près</p>

        <div className="mt-12 flex w-40 items-center gap-2 text-gold lg:mt-16" aria-hidden="true">
          <span className="h-px flex-1 bg-gold/60" />
          <span className="size-1.5 rotate-45 bg-gold" />
          <span className="h-px flex-1 bg-gold/60" />
        </div>
        <p className="mt-4 max-w-xs text-balance text-lg font-medium leading-snug text-cream">Retrouvez votre espace restaurant en toute sécurité.</p>
      </section>

      {/* Formulaire */}
      <section className="relative -mt-8 rounded-t-[2rem] bg-background px-6 pb-10 pt-9 shadow-[0_-12px_40px_-20px_rgba(0,0,0,0.5)] lg:mt-0 lg:flex lg:items-center lg:justify-center lg:rounded-none lg:px-12 lg:pb-12 lg:pt-12 lg:shadow-none">
        <div className="mx-auto w-full max-w-md">
          <header className="text-center">
            <h1 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl">Se connecter</h1>
          </header>

          <div role="tablist" aria-label="Type de compte" className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-card/90 p-1">
            {tabs.map((t) => {
              const selected = role === t.role
              return (
                <button
                  key={t.role}
                  type="button"
                  role="tab"
                  id={`login-tab-${t.role}`}
                  aria-selected={selected}
                  aria-controls="login-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => chooseRole(t.role)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                      e.preventDefault()
                      chooseRole(t.role === 'gerant' ? 'employe' : 'gerant')
                      document.getElementById(`login-tab-${t.role === 'gerant' ? 'employe' : 'gerant'}`)?.focus()
                    }
                  }}
                  className={cn(
                    'h-12 rounded-lg text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40',
                    selected ? 'bg-gradient-to-b from-ember to-ember-deep font-semibold text-primary-foreground shadow-md shadow-ember-deep/30' : 'text-foreground/85 hover:bg-muted/60',
                  )}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          <form id="login-panel" role="tabpanel" aria-labelledby={`login-tab-${role}`} onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
            {errors.form && (
              <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
                {errors.form}
              </p>
            )}

            <div>
              <label htmlFor="login-identifier" className="sr-only">
                Adresse e-mail ou téléphone
              </label>
              <div className={cn(fieldBase, errors.identifier ? 'border-destructive' : 'border-border')}>
                <Mail className="size-6 shrink-0 text-espresso/80" strokeWidth={1.6} aria-hidden="true" />
                <input
                  ref={identifierRef}
                  id="login-identifier"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Adresse e-mail ou Téléphone"
                  aria-invalid={!!errors.identifier}
                  aria-describedby={errors.identifier ? 'login-identifier-error' : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
              </div>
              {errors.identifier && (
                <p id="login-identifier-error" className="mt-1.5 text-sm text-destructive">
                  {errors.identifier}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="sr-only">
                Mot de passe
              </label>
              <div className={cn(fieldBase, errors.password ? 'border-destructive' : 'border-border')}>
                <Lock className="size-6 shrink-0 text-espresso/80" strokeWidth={1.6} aria-hidden="true" />
                <input
                  ref={passwordRef}
                  id="login-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={show}
                  className="-mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-espresso/80 hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
                >
                  {show ? <EyeOff className="size-6" strokeWidth={1.6} aria-hidden="true" /> : <Eye className="size-6" strokeWidth={1.6} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" className="mt-1.5 text-sm text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2.5 text-foreground/85">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer sr-only" />
                <span className="flex size-5 items-center justify-center rounded border border-border bg-card text-transparent transition-colors peer-checked:border-ember peer-checked:bg-ember peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ember/30">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                Se souvenir de moi
              </label>
              {role === 'gerant' ? (
                <a
                  href={`mailto:${legal.email}?subject=${encodeURIComponent('Mot de passe oublié – RestoBen')}`}
                  className="font-medium text-ember-deep hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
                >
                  Mot de passe oublié ?
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setInfo('Mot de passe oublié ? Demandez à votre gérant de vous aider à en définir un nouveau.')}
                  className="font-medium text-ember-deep hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>

            {info && (
              <p role="status" className="rounded-xl bg-gold/15 p-3 text-center text-sm text-[#6b4510]">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-ember to-ember-deep font-serif text-2xl font-medium text-primary-foreground shadow-lg shadow-ember-deep/30 transition-colors hover:from-ember-deep hover:to-ember-deep focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40 disabled:opacity-70"
            >
              {busy ? 'Connexion…' : 'Se connecter'}
              {!busy && <ArrowRight className="size-6" aria-hidden="true" />}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-foreground/85">
            {role === 'gerant' ? 'Vous êtes employé ? Utilisez l’onglet ' : 'Vous êtes gérant ? Utilisez l’onglet '}
            <button
              type="button"
              onClick={() => chooseRole(role === 'gerant' ? 'employe' : 'gerant')}
              className="font-semibold text-ember-deep hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
            >
              {role === 'gerant' ? 'Employé' : 'Gérant'}
            </button>{' '}
            ci-dessus.
          </p>

          {role === 'gerant' && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link href="/inscription" className="font-semibold text-ember-deep hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                Créer un compte
              </Link>
            </p>
          )}

          {DEMO_AUTH && (
            <p className="mt-5 rounded-xl bg-gold/15 p-3 text-center text-xs leading-relaxed text-[#6b4510]">
              {role === 'gerant'
                ? `Mode démonstration : les comptes ne sont pas encore vérifiés. Une adresse e-mail ou un téléphone valide et ${MIN_PASSWORD} caractères minimum suffisent pour entrer.`
                : `Mode démonstration : saisissez l’e-mail ou le téléphone d’un employé actif de la liste (ex. amina.diallo@restoben.bj) et un mot de passe de ${MIN_PASSWORD} caractères minimum.`}
            </p>
          )}

          <div className="mt-6 flex items-center gap-4 text-gold" aria-hidden="true">
            <span className="h-px flex-1 bg-gold/60" />
            <ShieldCheck className="size-8" strokeWidth={1.5} />
            <span className="h-px flex-1 bg-gold/60" />
          </div>
          <p className="mt-3 text-center text-sm text-foreground/80">Connexion sécurisée – Données protégées</p>
        </div>
      </section>
    </main>
  )
}
