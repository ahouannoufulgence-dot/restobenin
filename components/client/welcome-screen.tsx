import Image from 'next/image'
import { ChevronRight, Flame } from 'lucide-react'
import { restaurant } from '@/lib/client-data'

export function WelcomeScreen({ table, onStart }: { table: string; onStart: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,#9a3d16_0%,#6b2610_45%,#3a1407_100%)] px-6 pb-10 pt-14 text-cream lg:justify-center lg:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-between text-center lg:grid lg:flex-none lg:grid-cols-2 lg:gap-x-16 lg:text-left">
        <div className="flex flex-col items-center lg:items-start lg:self-end">
          <div className="flex items-center gap-2.5">
            <Flame className="size-9 fill-ember/40 text-ember" strokeWidth={1.75} aria-hidden="true" />
            <span className="font-serif text-4xl font-semibold">
              Resto<span className="text-ember">Ben</span>
            </span>
          </div>
          <h1 className="mt-10 font-serif text-4xl font-semibold leading-tight text-balance lg:text-6xl">Bienvenue au {restaurant.name}</h1>
          <p className="mt-2 text-lg text-cream/80">Table {table}</p>
        </div>

        <div className="relative my-8 aspect-square w-60 shrink-0 sm:w-72 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:my-0 lg:w-full lg:max-w-md lg:justify-self-center">
          <div className="absolute inset-4 rounded-full bg-ember/30 blur-3xl" aria-hidden="true" />
          <Image
            src="/images/gerant/hero-dish.png"
            alt="Plat du restaurant"
            fill
            priority
            sizes="(min-width: 1024px) 448px, 288px"
            className="rounded-full object-cover shadow-2xl ring-1 ring-cream/15"
          />
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-4 lg:items-start lg:self-start lg:pt-8">
          <p className="max-w-xs text-pretty text-cream/75 lg:max-w-md lg:text-lg">Commandez depuis votre table. Aucun compte à créer.</p>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cream px-6 text-sm font-semibold text-terracotta transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold/50 lg:w-auto lg:min-w-56"
          >
            Voir le menu
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </main>
  )
}
