import Image from 'next/image'
import { BellRing, PlayCircle, ScanLine, Sparkles, Star, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: ScanLine,
    title: 'Commandes fluides',
    text: 'Vos clients commandent en un scan, sans friction.',
  },
  {
    icon: BellRing,
    title: 'Stocks maîtrisés',
    text: 'Alertes intelligentes et contrôle total en temps réel.',
  },
  {
    icon: TrendingUp,
    title: 'Performance & Prestige',
    text: 'Analytics précises et avis clients pour briller.',
  },
]

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-espresso" aria-labelledby="hero-title">
      <Image
        src="/images/hero-restaurant.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso via-espresso/85 to-espresso/20"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-espresso to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-6 pb-16 pt-36 lg:px-10 lg:pb-20 lg:pt-44">
        <div className="max-w-2xl">
          <h1
            id="hero-title"
            className="text-balance font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-cream sm:text-6xl lg:text-7xl"
          >
            La gestion de restaurant, élevée au rang <em className="font-semibold not-italic text-gold">d&apos;art.</em>
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-cream/80">
            Commandes, stocks, équipes et performances — une seule plateforme pensée pour les restaurateurs exigeants
            du Bénin.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#tarifs"
              className="inline-flex items-center gap-2 rounded-md bg-ember px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-ember/30 transition-colors hover:bg-ember-deep"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Démarrer l&apos;expérience
            </a>
            <a
              href="#fonctionnalites"
              className="inline-flex items-center gap-2.5 rounded-md border border-cream/30 bg-espresso/40 px-6 py-3.5 text-sm font-semibold text-cream backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
            >
              Découvrir la démo
              <PlayCircle className="size-5" aria-hidden="true" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-cream/75">
            <div className="flex gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-gold text-gold" />
              ))}
            </div>
            <p>
              <span className="font-semibold text-cream">4.9/5</span> — Plus de 800 établissements nous font confiance au
              Bénin.
            </p>
          </div>
        </div>

        <ul id="fonctionnalites" className="mt-16 grid scroll-mt-24 gap-4 md:grid-cols-3 lg:mt-24">
          {features.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex items-center gap-5 rounded-xl border border-gold/25 bg-espresso/55 p-6 shadow-2xl shadow-black/40 backdrop-blur-md"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/5 text-gold">
                <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-cream">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-cream/70">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
