'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock,
  Flag,
  Headset,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  SquarePlay,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccount } from '@/lib/account-store'
import type { ManagerView } from '@/lib/gerant-data'
import { legal } from '@/lib/legal-info'
import { getPlan } from '@/lib/plans'
import { useSettings } from '@/lib/settings-store'
import {
  SUPPORT_RESPONSE_TIME,
  articles,
  categories,
  guideSteps,
  normalize,
  plannedVideos,
  supportSubjects,
  type HelpArticle,
  type HelpCategory,
} from '@/lib/help-content'
import { BrandMark } from './dashboard-screen'

type Page =
  | { name: 'home' }
  | { name: 'faq' }
  | { name: 'guide' }
  | { name: 'videos' }
  | { name: 'contact' }
  | { name: 'center' }
  | { name: 'category'; id: HelpCategory }
  | { name: 'article'; id: string }

const card = 'rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]'
const fieldClass =
  'w-full rounded-xl border border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground focus:border-ember focus:ring-3 focus:ring-ember/20 sm:text-sm'
/** Espace insécable avant « ? » pour qu'il ne passe jamais seul à la ligne. */
const nb = (text: string) => text.replace(/ ([?!:;])/g, '\u00a0$1')

const focusRing = 'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30'

const supportLevel = {
  basique: 'Support par e-mail',
  standard: 'Support prioritaire',
  premium: 'Support dédié 7j/7',
} as const

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-ember-deep min-[380px]:tracking-[0.18em]">{children}</h2>
}

function BackHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <header className="mb-5">
      <button type="button" onClick={onBack} className={cn('-ml-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-ember-deep hover:underline', focusRing)}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Aide &amp; Support
      </button>
      <h1 className="mt-1 font-serif text-3xl font-semibold leading-tight text-balance sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  )
}

function AccessRow({ icon: Icon, title, subtitle, onClick }: { icon: LucideIcon; title: string; subtitle: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={cn(card, 'flex min-h-[4.25rem] w-full items-center gap-3 p-2.5 pr-3 text-left transition-colors hover:border-ember', focusRing)}>
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-[#fdf1e4] text-ember-deep">
          <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-lg leading-tight">{title}</span>
          <span className="block text-[13px] leading-snug text-foreground/80">{subtitle}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-ember" aria-hidden="true" />
      </button>
    </li>
  )
}

function ArticleBody({ article, isManager, onNavigate, onContact }: { article: HelpArticle; isManager: boolean; onNavigate: (view: ManagerView) => void; onContact: () => void }) {
  return (
    <div>
      <ol className="grid gap-3">
        {article.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed">
            <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-ember text-xs font-semibold text-primary-foreground tabular-nums">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {article.note && <p className="mt-4 rounded-xl bg-gold/15 p-3 text-sm leading-relaxed text-[#6b4510]">{article.note}</p>}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {article.action && (isManager || !article.managerOnly) && (
          <button
            type="button"
            onClick={() => onNavigate(article.action!.view)}
            className={cn('inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ember px-5 text-sm font-semibold text-primary-foreground hover:bg-ember-deep', focusRing)}
          >
            {article.action.label}
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        )}
        <button type="button" onClick={onContact} className={cn('inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold hover:border-ember hover:text-ember', focusRing)}>
          Une autre question ? Contacter le support
        </button>
      </div>
    </div>
  )
}

function GuidePage({ isManager, onNavigate }: { isManager: boolean; onNavigate: (view: ManagerView) => void }) {
  const KEY = 'restoben:guide:v1'
  const [done, setDone] = useState<string[]>([])
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) setDone(parsed.filter((x): x is string => typeof x === 'string'))
    } catch {
      /* stockage indisponible */
    }
  }, [])
  const steps = guideSteps.filter((s) => isManager || !s.managerOnly)
  const count = steps.filter((s) => done.includes(s.id)).length

  function toggle(id: string) {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id]
    setDone(next)
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* stockage indisponible */
    }
  }

  return (
    <>
      <div className={cn(card, 'p-4')}>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium">Votre progression</span>
          <span className="tabular-nums text-muted-foreground">
            {count} / {steps.length} étapes
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-label="Progression du guide" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={count}>
          <div className="h-full rounded-full bg-ember transition-all" style={{ width: `${steps.length ? (count / steps.length) * 100 : 0}%` }} />
        </div>
      </div>

      <ol className="mt-4 grid gap-3">
        {steps.map((s, i) => {
          const checked = done.includes(s.id)
          return (
            <li key={s.id} className={cn(card, 'flex items-start gap-3 p-3', checked && 'bg-success/5')}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-label={`${s.title} : ${checked ? 'faite' : 'à faire'}`}
                onClick={() => toggle(s.id)}
                className={cn('mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors', checked ? 'border-success bg-success text-white' : 'border-border bg-background hover:border-ember', focusRing)}
              >
                {checked ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : <span className="text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn('font-serif text-lg leading-tight', checked && 'text-muted-foreground line-through decoration-1')}>{s.title}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-foreground/80">{s.description}</p>
                <button type="button" onClick={() => onNavigate(s.action.view)} className={cn('mt-2 inline-flex h-9 items-center gap-1 rounded-lg px-1 text-sm font-semibold text-ember-deep hover:underline', focusRing)}>
                  Ouvrir {s.action.label}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}

function ContactPage() {
  const account = useAccount()
  const settings = useSettings()
  const [subject, setSubject] = useState(supportSubjects[0]!)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const plan = account ? getPlan(account.planId) : null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 10) return setError('Décrivez votre demande en quelques mots (10 caractères minimum).')
    setError('')
    const lines = [
      message.trim(),
      '',
      '— Informations du compte —',
      `Restaurant : ${settings.restaurantName}`,
      account ? `Responsable : ${account.manager} (${account.email})` : null,
      plan && account ? `Formule : ${plan.name} (${account.billing})` : null,
    ].filter((l): l is string => l !== null)
    window.location.href = `mailto:${legal.email}?subject=${encodeURIComponent(`[RestoBen] ${subject}`)}&body=${encodeURIComponent(lines.join('\n'))}`
    setSent(true)
  }

  return (
    <div className="grid gap-4">
      <div className={cn(card, 'flex items-center gap-3 p-4')}>
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sand text-ember-deep">
          <Headset className="size-6" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold">{plan ? `${supportLevel[plan.id]} · formule ${plan.name}` : 'Une équipe disponible pour vous aider'}</p>
          <p className="text-muted-foreground">Temps de réponse moyen : {SUPPORT_RESPONSE_TIME}</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className={cn(card, 'grid gap-4 p-4 sm:p-5')}>
        <div>
          <label htmlFor="support-subject" className="mb-1.5 block text-sm font-medium">Sujet</label>
          <select id="support-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={cn(fieldClass, 'h-11')}>
            {supportSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="support-message" className="mb-1.5 block text-sm font-medium">Votre message</label>
          <textarea
            id="support-message"
            rows={5}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setError('')
            }}
            placeholder="Décrivez votre question ou le problème rencontré…"
            aria-invalid={!!error}
            className={cn(fieldClass, 'py-3', error && 'border-destructive')}
          />
          {error && <p role="alert" className="mt-1.5 text-sm text-destructive">{error}</p>}
        </div>
        <button type="submit" className={cn('inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember to-ember-deep text-base font-semibold text-primary-foreground shadow-lg shadow-ember-deep/25', focusRing)}>
          <MessageCircle className="size-5" aria-hidden="true" />
          Envoyer par e-mail
        </button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {sent
            ? `Votre application de messagerie s’est ouverte. Si rien ne s’affiche, écrivez-nous à ${legal.email}.`
            : 'Votre application de messagerie s’ouvre avec le message prêt à envoyer. Le nom de votre restaurant et votre formule y sont ajoutés.'}
        </p>
      </form>

      <a href={legal.phoneHref} className={cn(card, 'flex h-14 items-center justify-center gap-2.5 text-base font-semibold hover:border-ember hover:text-ember', focusRing)}>
        <Phone className="size-5" aria-hidden="true" />
        Appeler le {legal.phone}
      </a>
    </div>
  )
}

export function HelpScreen({ isManager, onNavigate, initial }: { isManager: boolean; onNavigate: (view: ManagerView) => void; initial?: 'contact' }) {
  const [stack, setStack] = useState<Page[]>(initial === 'contact' ? [{ name: 'home' }, { name: 'contact' }] : [{ name: 'home' }])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const page = stack[stack.length - 1]!

  const visible = useMemo(() => articles.filter((a) => isManager || !a.managerOnly), [isManager])
  const popular = useMemo(() => visible.filter((a) => a.popular).sort((a, b) => a.popular! - b.popular!), [visible])
  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (q.length < 2) return null
    return visible.filter((a) => normalize([a.question, ...a.steps, a.note ?? ''].join(' ')).includes(q))
  }, [query, visible])

  function go(next: Page) {
    setStack((s) => [...s, next])
    setOpen(null)
    window.scrollTo({ top: 0 })
  }
  function back() {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
    setOpen(null)
    window.scrollTo({ top: 0 })
  }
  const contact = () => go({ name: 'contact' })
  const byId = (id: string) => visible.find((a) => a.id === id)

  const accordion = (list: HelpArticle[]) => (
    <ul className="grid gap-2.5">
      {list.map((a) => {
        const expanded = open === a.id
        return (
          <li key={a.id} className={cn(card, 'overflow-hidden')}>
            <h3>
              <button type="button" aria-expanded={expanded} aria-controls={`faq-${a.id}`} onClick={() => setOpen(expanded ? null : a.id)} className={cn('flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left', focusRing)}>
                <span className="min-w-0 flex-1 font-serif text-[17px] leading-snug">{nb(a.question)}</span>
                <ChevronDown className={cn('size-5 shrink-0 text-ember transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
              </button>
            </h3>
            {expanded && (
              <div id={`faq-${a.id}`} className="border-t border-border px-4 py-4">
                <ArticleBody article={a} isManager={isManager} onNavigate={onNavigate} onContact={contact} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )

  /* ---------- Sous-pages ---------- */
  if (page.name === 'faq') {
    return (
      <div className="mx-auto max-w-2xl">
        <BackHeader title="Questions fréquentes" subtitle="Des réponses rapides, étape par étape." onBack={back} />
        {accordion(visible.filter((a) => a.faq))}
      </div>
    )
  }
  if (page.name === 'guide') {
    return (
      <div className="mx-auto max-w-2xl">
        <BackHeader title="Guide de démarrage" subtitle="Configurez votre restaurant en quelques étapes." onBack={back} />
        <GuidePage isManager={isManager} onNavigate={onNavigate} />
      </div>
    )
  }
  if (page.name === 'videos') {
    return (
      <div className="mx-auto max-w-2xl">
        <BackHeader title="Tutoriels vidéo" subtitle="Apprenez visuellement à utiliser RestoBen." onBack={back} />
        <p className="rounded-xl bg-gold/15 p-3 text-sm leading-relaxed text-[#6b4510]">
          Les tutoriels vidéo arrivent bientôt. En attendant, le guide de démarrage et le centre d’aide expliquent chaque module pas à pas.
        </p>
        <ul className="mt-4 grid gap-2.5">
          {plannedVideos.map((title) => (
            <li key={title} className={cn(card, 'flex items-center gap-3 p-3')}>
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sand text-ember-deep">
                <SquarePlay className="size-6" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium">{title}</span>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Bientôt</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => go({ name: 'guide' })} className={cn('h-11 rounded-xl border border-border bg-card text-sm font-semibold hover:border-ember hover:text-ember', focusRing)}>Voir le guide de démarrage</button>
          <button type="button" onClick={() => go({ name: 'center' })} className={cn('h-11 rounded-xl border border-border bg-card text-sm font-semibold hover:border-ember hover:text-ember', focusRing)}>Ouvrir le centre d’aide</button>
        </div>
      </div>
    )
  }
  if (page.name === 'contact') {
    return (
      <div className="mx-auto max-w-2xl">
        <BackHeader title="Contacter le support" subtitle="Une équipe disponible pour vous aider." onBack={back} />
        <ContactPage />
      </div>
    )
  }
  if (page.name === 'center') {
    return (
      <div className="mx-auto max-w-2xl">
        <BackHeader title="Centre d’aide" subtitle="Articles détaillés et ressources, par thème." onBack={back} />
        <ul className="grid gap-2.5">
          {categories.map((c) => {
            const n = visible.filter((a) => a.category === c.id).length
            if (n === 0) return null
            return (
              <li key={c.id}>
                <button type="button" onClick={() => go({ name: 'category', id: c.id })} className={cn(card, 'flex min-h-16 w-full items-center gap-3 p-3 pr-3 text-left transition-colors hover:border-ember', focusRing)}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-lg leading-tight">{c.label}</span>
                    <span className="block text-[13px] text-foreground/80">{c.description}</span>
                  </span>
                  <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold tabular-nums text-ember-deep">{n}</span>
                  <ChevronRight className="size-5 shrink-0 text-ember" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
  if (page.name === 'category') {
    const cat = categories.find((c) => c.id === page.id)
    return (
      <div className="mx-auto max-w-2xl">
        <BackHeader title={cat?.label ?? 'Articles'} subtitle={cat?.description} onBack={back} />
        {accordion(visible.filter((a) => a.category === page.id))}
      </div>
    )
  }
  if (page.name === 'article') {
    const a = byId(page.id)
    return (
      <div className="mx-auto max-w-2xl">
        <BackHeader title={a ? nb(a.question) : 'Article introuvable'} onBack={back} />
        {a ? (
          <div className={cn(card, 'p-4 sm:p-5')}>
            <ArticleBody article={a} isManager={isManager} onNavigate={onNavigate} onContact={contact} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Cet article n’existe plus.</p>
        )}
      </div>
    )
  }

  /* ---------- Accueil ---------- */
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div className="flex items-center gap-2.5 text-gold">
          <BrandMark className="size-11 shrink-0" />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-3xl font-medium text-foreground">RestoBen</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-foreground/80">Manager</span>
          </span>
        </div>
        <ShieldCheck className="size-9 shrink-0 text-gold" strokeWidth={1.4} aria-label="Compte sécurisé" role="img" />
      </div>

      <h1 className="mt-5 text-center font-serif text-4xl font-medium leading-tight text-foreground lg:mt-0 sm:text-5xl">Aide &amp; Support</h1>
      <div className="mx-auto mt-2 flex w-44 items-center gap-2 text-gold" aria-hidden="true">
        <span className="h-px flex-1 bg-gold/60" />
        <span className="size-1.5 rotate-45 bg-gold" />
        <span className="h-px flex-1 bg-gold/60" />
      </div>

      <div className="relative mt-5">
        <label htmlFor="help-search" className="sr-only">Rechercher une question</label>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        <input
          id="help-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une question…"
          autoComplete="off"
          className={cn(card, 'h-14 w-full bg-card pl-13 pr-12 text-base outline-none placeholder:text-muted-foreground focus:border-ember focus:ring-3 focus:ring-ember/20')}
          style={{ paddingLeft: '3.25rem' }}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche" className={cn('absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-ember', focusRing)}>
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {results ? (
        <section aria-live="polite" aria-label="Résultats de la recherche">
          <SectionLabel>{results.length} résultat{results.length > 1 ? 's' : ''}</SectionLabel>
          {results.length === 0 ? (
            <div className={cn(card, 'p-5 text-center text-sm')}>
              <p className="text-muted-foreground">Aucune réponse trouvée pour « {query.trim()} ».</p>
              <button type="button" onClick={contact} className={cn('mt-3 inline-flex h-11 items-center rounded-xl bg-ember px-5 font-semibold text-primary-foreground', focusRing)}>
                Poser la question au support
              </button>
            </div>
          ) : (
            accordion(results)
          )}
        </section>
      ) : (
        <>
          <SectionLabel>Accéder à l’aide</SectionLabel>
          <ul className="grid gap-2.5">
            <AccessRow icon={CircleHelp} title="Questions fréquentes (FAQ)" subtitle="Trouvez des réponses rapides" onClick={() => go({ name: 'faq' })} />
            <AccessRow icon={Flag} title="Guide de démarrage" subtitle="Configurez votre restaurant en quelques étapes" onClick={() => go({ name: 'guide' })} />
            <AccessRow icon={SquarePlay} title="Tutoriels vidéo" subtitle="Apprenez visuellement à utiliser RestoBen" onClick={() => go({ name: 'videos' })} />
            <AccessRow icon={Headset} title="Contacter le support" subtitle="Une équipe disponible pour vous aider" onClick={contact} />
            <AccessRow icon={BookOpen} title="Centre d’aide" subtitle="Articles détaillés et ressources" onClick={() => go({ name: 'center' })} />
          </ul>

          <SectionLabel>Questions populaires</SectionLabel>
          <ul className="grid gap-2">
            {popular.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => go({ name: 'article', id: a.id })} className={cn(card, 'flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:border-ember', focusRing)}>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-ember-deep text-lg font-semibold leading-none text-primary-foreground" aria-hidden="true">?</span>
                  <span className="min-w-0 flex-1 font-serif text-[17px] leading-snug">{nb(a.question)}</span>
                  <ChevronRight className="size-5 shrink-0 text-ember" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={contact}
            className={cn('mt-4 flex h-16 w-full items-center gap-4 rounded-2xl bg-gradient-to-b from-ember to-ember-deep px-3 text-primary-foreground shadow-lg shadow-ember-deep/30', focusRing)}
          >
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-ember-deep">
              <MessageCircle className="size-6" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="flex-1 pr-11 text-center font-serif text-xl min-[380px]:text-2xl max-[359px]:pr-4">Contacter le support</span>
          </button>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-foreground/85">
            <Clock className="size-5 text-gold" strokeWidth={1.6} aria-hidden="true" />
            Temps de réponse moyen : <span className="font-semibold text-ember-deep">{SUPPORT_RESPONSE_TIME}</span>
          </p>
        </>
      )}
    </div>
  )
}
