import type React from 'react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/gerant-data'

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)] sm:p-5', className)}>
      {children}
    </div>
  )
}

export function ScreenHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground text-balance sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export const iconButton =
  'relative inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30'

export const primaryAction =
  'inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ember px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-ember/25 transition-colors hover:bg-ember-deep focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/35'

const statusStyles: Record<OrderStatus, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-gold/20 text-[#8a5a12]' },
  en_cours: { label: 'En cours', className: 'bg-ember/12 text-ember-deep' },
  pret: { label: 'Prêt', className: 'bg-success/15 text-success' },
  terminee: { label: 'Terminée', className: 'bg-muted text-muted-foreground' },
  annulee: { label: 'Annulée', className: 'bg-destructive/12 text-destructive' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const style = statusStyles[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', style.className)}>
      {style.label}
    </span>
  )
}

export function Trend({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-success/12 px-2 py-0.5 text-xs font-semibold text-success">
      +{value} %
    </span>
  )
}
