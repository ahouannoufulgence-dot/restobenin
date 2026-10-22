import { ArrowRight, Check, Download } from 'lucide-react'
import Link from 'next/link'
import type React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard, primaryButton, secondaryButton } from './ui'

const confetti = [
  { left: '8%', top: '10%', color: 'bg-ember', rotate: '35deg', delay: '0.05s', shape: 'h-3 w-1.5' },
  { left: '18%', top: '30%', color: 'bg-gold', rotate: '-20deg', delay: '0.2s', shape: 'size-2 rounded-full' },
  { left: '12%', top: '58%', color: 'bg-terracotta', rotate: '60deg', delay: '0.35s', shape: 'h-2.5 w-1.5' },
  { left: '26%', top: '6%', color: 'bg-gold', rotate: '15deg', delay: '0.1s', shape: 'h-3.5 w-1.5' },
  { left: '74%', top: '8%', color: 'bg-ember', rotate: '-40deg', delay: '0.15s', shape: 'size-2 rounded-full' },
  { left: '84%', top: '26%', color: 'bg-gold', rotate: '70deg', delay: '0.3s', shape: 'h-3 w-1.5' },
  { left: '90%', top: '52%', color: 'bg-ember', rotate: '25deg', delay: '0.45s', shape: 'h-2.5 w-1.5' },
  { left: '68%', top: '20%', color: 'bg-terracotta', rotate: '-60deg', delay: '0.25s', shape: 'size-1.5 rounded-full' },
  { left: '34%', top: '22%', color: 'bg-ember', rotate: '80deg', delay: '0.4s', shape: 'size-1.5 rounded-full' },
  { left: '60%', top: '4%', color: 'bg-gold', rotate: '-10deg', delay: '0.5s', shape: 'h-3 w-1.5' },
]

export function SuccessStep({ restaurant, planName, email }: { restaurant: string; planName: string; email: string }) {
  return (
    <section aria-labelledby="success-title" className="mx-auto w-full max-w-2xl">
      <GlassCard className="relative overflow-hidden px-6 py-14 text-center sm:px-14">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {confetti.map((piece, index) => (
            <span
              key={index}
              className={cn('confetti-piece absolute', piece.color, piece.shape)}
              style={{ left: piece.left, top: piece.top, '--rotate': piece.rotate, '--delay': piece.delay } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="relative mx-auto w-fit">
          <span className="absolute -inset-3 rounded-full bg-success/15" aria-hidden="true" />
          <span className="relative flex size-28 items-center justify-center rounded-full bg-success shadow-2xl shadow-success/35">
            <Check className="size-14 text-white" strokeWidth={3} aria-hidden="true" />
          </span>
        </div>

        <h1 id="success-title" className="relative mt-10 text-balance font-serif text-5xl font-semibold text-foreground">
          Inscription réussie !
        </h1>
        <p className="relative mx-auto mt-4 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
          Bienvenue chez RestoBen. <span className="font-semibold text-foreground">{restaurant}</span> est prêt à
          démarrer.
        </p>
        <p className="relative mt-3 text-sm text-muted-foreground">
          Formule {planName} activée · Reçu envoyé à <span className="break-all text-foreground">{email}</span>
        </p>

        <div className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/gerant" className={primaryButton}>
            Accéder à mon espace restaurant
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/#ressources" className={secondaryButton}>
            <Download className="size-4" aria-hidden="true" />
            Télécharger le guide de démarrage
          </Link>
        </div>
      </GlassCard>
    </section>
  )
}
