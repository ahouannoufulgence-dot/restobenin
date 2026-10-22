import { useState } from 'react'
import { Check, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { emberAction, outlineAction } from './ui'

export function ReviewSheet({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <div className="w-full max-w-md rounded-t-3xl bg-background p-5 md:rounded-3xl md:p-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
        {sent ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-success text-primary-foreground">
              <Check className="size-7" strokeWidth={3} aria-hidden="true" />
            </span>
            <h2 id="review-title" className="mt-4 font-serif text-2xl font-semibold">
              Merci pour votre avis
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Il aide le restaurant à s’améliorer.</p>
            <button type="button" onClick={onClose} className={`${emberAction} mt-6`}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <h2 id="review-title" className="font-serif text-2xl font-semibold">
              Comment était votre repas ?
            </h2>
            <div className="mt-4 flex gap-2" role="radiogroup" aria-label="Note sur 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                  onClick={() => setRating(n)}
                  className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
                >
                  <Star className={cn('size-9', n <= rating ? 'fill-gold text-gold' : 'text-border')} aria-hidden="true" />
                </button>
              ))}
            </div>
            <label htmlFor="review-comment" className="mt-4 block text-sm font-medium">
              Votre commentaire (facultatif)
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border border-input bg-card p-3 text-sm outline-none focus-visible:border-ember focus-visible:ring-3 focus-visible:ring-ember/25"
            />
            <div className="mt-4 flex flex-col gap-3">
              <button type="button" disabled={rating === 0} onClick={() => setSent(true)} className={`${emberAction} disabled:pointer-events-none disabled:opacity-50`}>
                Envoyer mon avis
              </button>
              <button type="button" onClick={onClose} className={outlineAction}>
                Plus tard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
