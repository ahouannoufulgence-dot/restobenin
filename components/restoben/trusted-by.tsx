import { Fragment } from 'react'

const partners = [
  { name: 'Chez Amina', city: 'Cotonou' },
  { name: 'Le Palmier', city: 'Porto-Novo' },
  { name: 'Saveurs du Bénin' },
  { name: 'Akassa King' },
  { name: 'Poisson d’Or' },
]

export function Ornament() {
  return <span className="inline-block size-1.5 rotate-45 bg-gold" aria-hidden="true" />
}

export function TrustedBy() {
  return (
    <section className="bg-cream py-14" aria-labelledby="trust-title">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex items-center gap-5">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/60" aria-hidden="true" />
          <Ornament />
          <h2 id="trust-title" className="font-serif text-xl font-medium tracking-[0.2em] text-foreground">
            Ils nous font confiance
          </h2>
          <Ornament />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/60" aria-hidden="true" />
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:justify-between">
          {partners.map((p, i) => (
            <Fragment key={p.name}>
              {i > 0 && <li className="hidden size-1.5 rounded-full bg-ember/70 sm:block" aria-hidden="true" />}
              <li className="font-serif text-2xl text-foreground/90">
                {p.name}
                {p.city && <span className="text-muted-foreground"> · {p.city}</span>}
              </li>
            </Fragment>
          ))}
        </ul>
      </div>
    </section>
  )
}
