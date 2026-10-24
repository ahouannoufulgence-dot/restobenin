import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({
  withTagline = true,
  hideTaglineOnMobile = false,
  href = '#',
  className,
}: {
  withTagline?: boolean
  hideTaglineOnMobile?: boolean
  href?: string
  className?: string
}) {
  return (
    <a href={href} className={cn('flex items-center gap-2.5', className)} aria-label="RestoBen, accueil">
      <Flame className="size-9 shrink-0 fill-ember/30 text-ember" strokeWidth={1.75} aria-hidden="true" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-3xl font-semibold tracking-tight text-cream">
          Resto<span className="text-ember">Ben</span>
        </span>
        {withTagline && (
          <span className={cn('mt-1 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.14em] text-cream/70', hideTaglineOnMobile && 'max-sm:hidden')}>
            La gestion élevée au goût près
          </span>
        )}
      </span>
    </a>
  )
}
