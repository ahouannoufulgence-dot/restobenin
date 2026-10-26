import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Photo décorative (plat, article, employé).
 * - Photo du site (chemin local) : redimensionnée selon l'écran et servie en WebP par Next.
 * - Photo téléversée par le restaurant (data:) : déjà réduite à l'envoi, affichée telle quelle.
 * Les classes de `className` fixent la taille de la zone (ex. « size-16 », « h-20 w-full »).
 */
export function Photo({ src, className, sizes = '128px' }: { src: string; className?: string; sizes?: string }) {
  if (!src.startsWith('/')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading="lazy" decoding="async" className={cn('object-cover', className)} />
  }
  return (
    <span className={cn('relative block overflow-hidden', className)}>
      <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
    </span>
  )
}
