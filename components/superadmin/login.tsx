'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, Crown, Eye, EyeOff, Flame, Lock, ShieldCheck, TriangleAlert, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEMO_SUPERADMIN, signInSuperAdmin } from '@/lib/superadmin-auth'
import { legal } from '@/lib/legal-info'

const field = 'flex h-14 items-center gap-3 rounded-lg border bg-card/80 px-4 transition-colors focus-within:border-ember focus-within:ring-3 focus-within:ring-ember/20'

function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto flex w-40 items-center gap-2 text-gold', className)} aria-hidden="true">
      <span className="h-px flex-1 bg-gold/70" />
      <span className="size-1.5 rotate-45 bg-gold" />
      <span className="h-px flex-1 bg-gold/70" />
    </div>
  )
}

export function SuperAdminLogin() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)
  const idRef = useRef<HTMLInputElement>(null)
  const pwRef = useRef<HTMLInputElement>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!identifier.trim()) next.identifier = 'Indiquez votre identifiant.'
    if (!password) next.password = 'Indiquez votre mot de passe.'
    setErrors(next)
    if (next.identifier) return idRef.current?.focus()
    if (next.password) return pwRef.current?.focus()
    setBusy(true)
    const result = await signInSuperAdmin(identifier, password, remember)
    if (!result.ok) {
      setBusy(false)
      return setErrors({ form: result.error })
    }
    router.push('/superadmin')
  }

  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-2">
      {/* Panneau sombre */}
      <section className="relative isolate flex min-h-[26rem] flex-col items-center justify-between overflow-hidden bg-[#120b07] px-8 py-10 text-center text-cream lg:min-h-dvh">
        <Image src="/images/superadmin-bg.jpg" alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="-z-20 object-cover object-[35%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#120b07]/85 via-[#120b07]/60 to-[#120b07]/90" aria-hidden="true" />

        <div className="flex flex-col items-center">
          <Flame className="size-14 fill-ember/60 text-ember drop-shadow-lg" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-1 font-serif text-5xl font-semibold leading-none sm:text-6xl">
            <span className="text-[#e8c98a]">Resto</span>
            <span className="text-ember">Ben</span>
          </p>
          <div className="mt-3 flex items-center gap-3 text-[#e8c98a]">
            <span className="h-px w-10 bg-gold/70" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-[0.3em]">Super Admin</span>
            <span className="h-px w-10 bg-gold/70" aria-hidden="true" />
          </div>
        </div>

        <div className="my-8 flex flex-col items-center">
          <span className="relative inline-flex size-16 items-center justify-center text-gold" aria-hidden="true">
            <svg viewBox="0 0 64 72" className="absolute inset-0 size-full" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
              <path d="M32 4 56 13v22c0 17-11 28-24 33C19 63 8 52 8 35V13L32 4Z" />
            </svg>
            <Crown className="relative -mt-1 size-7" strokeWidth={1.8} />
          </span>
          <p className="mt-4 font-serif text-2xl italic text-[#e8c98a]">Contrôle total de la plateforme</p>
          <Ornament className="mt-3 w-32" />
        </div>

        <p className="flex items-center gap-2 text-sm text-cream/90">
          <Lock className="size-4 text-gold" aria-hidden="true" />
          Accès réservé aux administrateurs autorisés.
        </p>
      </section>

      {/* Formulaire */}
      <section className="flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          <header className="text-center">
            <Ornament className="mb-5 w-36" />
            <h1 className="font-serif text-4xl font-semibold text-balance sm:text-5xl">Connexion Super Admin</h1>
            <p className="mt-3 text-foreground/75">Accédez au tableau de bord de supervision</p>
            <Ornament className="mt-4 w-36" />
          </header>

          <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-4">
            {errors.form && (
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
                {errors.form}
              </p>
            )}

            <div>
              <label htmlFor="sa-id" className="sr-only">
                Identifiant Super Admin
              </label>
              <div className={cn(field, errors.identifier ? 'border-destructive' : 'border-gold/60')}>
                <User className="size-6 shrink-0 text-espresso/85" strokeWidth={1.7} aria-hidden="true" />
                <input
                  ref={idRef}
                  id="sa-id"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Identifiant Super Admin"
                  aria-invalid={!!errors.identifier}
                  aria-describedby={errors.identifier ? 'sa-id-error' : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
                <ShieldCheck className="size-6 shrink-0 text-espresso/85" strokeWidth={1.7} aria-hidden="true" />
              </div>
              {errors.identifier && (
                <p id="sa-id-error" className="mt-1.5 text-sm text-destructive">
                  {errors.identifier}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="sa-pw" className="sr-only">
                Mot de passe
              </label>
              <div className={cn(field, errors.password ? 'border-destructive' : 'border-gold/60')}>
                <Lock className="size-6 shrink-0 text-espresso/85" strokeWidth={1.7} aria-hidden="true" />
                <input
                  ref={pwRef}
                  id="sa-pw"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Mot de passe"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'sa-pw-error' : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={show}
                  className="-mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-espresso/85 hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
                >
                  {show ? <EyeOff className="size-6" strokeWidth={1.7} aria-hidden="true" /> : <Eye className="size-6" strokeWidth={1.7} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p id="sa-pw-error" className="mt-1.5 text-sm text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer sr-only" />
                <span className="flex size-5 items-center justify-center rounded border border-border bg-card text-transparent transition-colors peer-checked:border-ember-deep peer-checked:bg-ember-deep peer-checked:text-white peer-focus-visible:ring-3 peer-focus-visible:ring-ember/30">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                Se souvenir de moi
              </label>
              <a
                href={`mailto:${legal.email}?subject=${encodeURIComponent('Mot de passe oublié – RestoBen Super Admin')}`}
                className="font-medium text-ember-deep hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
              >
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-1 inline-flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-ember-deep text-base font-semibold text-white shadow-lg shadow-ember-deep/30 transition-colors hover:bg-ember-deep/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40 disabled:opacity-70"
            >
              <Crown className="size-5" aria-hidden="true" />
              {busy ? 'Connexion…' : 'Accéder au Super Admin'}
            </button>
          </form>

          {DEMO_SUPERADMIN && (
            <p className="mt-5 flex gap-2 rounded-lg bg-gold/15 p-3 text-xs leading-relaxed text-[#6b4510]">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <strong>Maquette :</strong> les accès ne sont pas vérifiés et toutes les données sont fictives. Saisissez un identifiant (3 caractères min.) et un mot de passe (8 caractères min.).
              </span>
            </p>
          )}

          <p className="mt-5 flex items-center gap-3 text-sm text-foreground/85">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-sand text-espresso">
              <Lock className="size-5" aria-hidden="true" />
            </span>
            Connexion hautement sécurisée – Accès restreint
          </p>
          <hr className="mt-5 border-border" />
          <p className="mt-4 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} RestoBen – Accès Super Admin.</p>
        </div>
      </section>
    </main>
  )
}
