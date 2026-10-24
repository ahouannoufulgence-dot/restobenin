import Image from 'next/image'
import { ChevronRight, Flame } from 'lucide-react'
import { primaryAction } from './shared'

export function WelcomeScreen({ firstName, subtitle, onStart, onModules }: { firstName: string; subtitle: string; onStart: () => void; onModules: () => void }) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,#9a3d16_0%,#6b2610_45%,#3a1407_100%)] text-cream">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-10 px-6 py-10 lg:flex-row lg:gap-16 lg:py-16">
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <div className="flex items-center gap-3">
            <Flame className="size-10 fill-ember/40 text-ember" strokeWidth={1.75} aria-hidden="true" />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-4xl font-semibold">
                Resto<span className="text-ember">Ben</span>
              </span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-[0.35em] text-cream/60">Manager</span>
            </div>
          </div>

          <p className="mt-12 text-sm font-medium uppercase tracking-[0.25em] text-gold">Espace gérant</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-balance sm:text-5xl">
            Bonjour, {firstName}
          </h1>
          <p className="mt-2 font-serif text-2xl text-cream/85">
            {subtitle}
          </p>
          <p className="mt-5 max-w-md text-pretty leading-relaxed text-cream/70">
            Votre service du jour vous attend : commandes, tables, carte et performances réunies en un seul endroit.
          </p>

          <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row lg:justify-start">
            <button type="button" onClick={onStart} className={`${primaryAction} sm:min-w-56`}>
              Tableau de bord
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onModules}
              className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold text-cream underline decoration-cream/40 underline-offset-4 transition-colors hover:text-gold hover:decoration-gold focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold/40"
            >
              Voir les modules
            </button>
          </div>
        </div>

        <div className="relative aspect-square w-full max-w-sm shrink-0 sm:max-w-md lg:max-w-lg">
          <div className="absolute inset-6 rounded-full bg-ember/30 blur-3xl" aria-hidden="true" />
          <Image
            src="/images/gerant/hero-dish.png"
            alt="Poulet yassa dressé dans une assiette, spécialité du restaurant"
            fill
            priority
            sizes="(min-width: 1024px) 512px, 90vw"
            className="rounded-full object-cover shadow-2xl ring-1 ring-cream/15"
          />
        </div>
      </div>
    </main>
  )
}
