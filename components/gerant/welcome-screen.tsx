import Image from 'next/image'
import { ChevronRight, Utensils } from 'lucide-react'

/** Première page de l'espace gérant : accueil plein écran avec la photo d'un plat signature. */
export function WelcomeScreen({ firstName, restaurantName, onStart, onModules }: { firstName: string; restaurantName: string; onStart: () => void; onModules: () => void }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#913913_0%,#7d2f0e_55%,#6e280b_100%)] text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-12 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_auto_auto] lg:content-center lg:gap-x-16 lg:px-10 lg:pb-16 lg:pt-16">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 lg:col-start-1 lg:row-start-1 lg:justify-start">
          <Utensils className="size-11 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          <div className="flex flex-col leading-none">
            <span className="text-3xl font-semibold tracking-tight">RestoBen</span>
            <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.3em] text-white/75">Manager</span>
          </div>
        </div>

        {/* Message de bienvenue */}
        <h1 className="mt-10 text-center text-[1.7rem] font-semibold leading-snug text-balance sm:text-3xl lg:col-start-1 lg:row-start-2 lg:mt-14 lg:text-left lg:text-5xl lg:leading-tight">
          Bonjour, {firstName} –<br />
          Restaurant {restaurantName}
        </h1>

        {/* Photo : l'assiette remplit presque la largeur de l'écran */}
        <div className="flex flex-1 items-center justify-center py-6 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:py-0">
          <div className="relative aspect-square w-[min(112vw,28rem,46dvh)] shrink-0 lg:w-full lg:max-w-lg">
            <div className="absolute inset-4 rounded-full bg-black/35 blur-2xl" aria-hidden="true" />
            <Image
              src="/images/gerant/welcome-plate.jpg"
              alt="Poulet yassa dressé sur une assiette, spécialité du restaurant"
              fill
              priority
              sizes="(min-width: 1024px) 512px, 112vw"
              className="rounded-full object-cover shadow-2xl"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-5 lg:col-start-1 lg:row-start-3 lg:items-start lg:self-start lg:pt-10">
          <button
            type="button"
            onClick={onStart}
            className="relative flex h-14 w-full items-center justify-center rounded-2xl bg-ember text-lg font-medium text-white shadow-lg shadow-black/25 transition-colors hover:bg-[#f06a14] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/60 lg:max-w-sm"
          >
            Tableau de bord
            <ChevronRight className="absolute right-5 size-6" strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onModules}
            className="rounded-lg px-3 py-2 text-base font-medium text-white underline decoration-white/70 underline-offset-[6px] transition-colors hover:decoration-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/60"
          >
            Voir les modules
          </button>
        </div>
      </div>
    </main>
  )
}
