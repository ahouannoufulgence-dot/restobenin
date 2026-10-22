import Image from 'next/image'
import { ChevronRight, Flame } from 'lucide-react'
import { restaurant } from '@/lib/client-data'

export function WelcomeScreen({ table, onStart }: { table: string; onStart: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-between bg-[radial-gradient(ellipse_at_top,#9a3d16_0%,#6b2610_45%,#3a1407_100%)] px-6 pb-10 pt-14 text-center text-cream">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2.5">
          <Flame className="size-9 fill-ember/40 text-ember" strokeWidth={1.75} aria-hidden="true" />
          <span className="font-serif text-4xl font-semibold">
            Resto<span className="text-ember">Ben</span>
          </span>
        </div>
        <h1 className="mt-10 font-serif text-4xl font-semibold leading-tight text-balance">Bienvenue au {restaurant.name}</h1>
        <p className="mt-2 text-lg text-cream/80">Table {table}</p>
      </div>

      <div className="relative my-8 aspect-square w-60 shrink-0">
        <div className="absolute inset-4 rounded-full bg-ember/30 blur-3xl" aria-hidden="true" />
        <Image
          src="/images/gerant/hero-dish.png"
          alt="Plat du restaurant"
          fill
          priority
          sizes="240px"
          className="rounded-full object-cover shadow-2xl ring-1 ring-cream/15"
        />
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <p className="max-w-xs text-pretty text-cream/75">Commandez depuis votre table. Aucun compte à créer.</p>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cream px-6 text-sm font-semibold text-terracotta transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold/50"
        >
          Voir le menu
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </main>
  )
}
