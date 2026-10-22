import type { LucideIcon } from 'lucide-react'
import type React from 'react'
import { cn } from '@/lib/utils'

export const primaryButton =
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ember px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-ember/25 transition-colors hover:bg-ember-deep focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/35 disabled:pointer-events-none disabled:opacity-70'

export const secondaryButton =
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-foreground/20 bg-card/60 px-6 text-sm font-semibold text-foreground transition-colors hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/25'

export const ghostButton =
  'inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/25'

export function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/80 bg-card/80 shadow-2xl shadow-terracotta/10 backdrop-blur-md',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function StepHeading({
  id,
  title,
  subtitle,
  className,
}: {
  id: string
  title: string
  subtitle?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('text-center', className)}>
      <h1 id={id} className="text-balance font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      {subtitle && <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

type TextFieldProps = Omit<React.ComponentProps<'input'>, 'prefix'> & {
  id: string
  label: string
  icon: LucideIcon
  error?: string
  prefix?: string
  trailing?: React.ReactNode
  wrapperClassName?: string
}

export function TextField({ id, label, icon: Icon, error, prefix, trailing, wrapperClassName, ...props }: TextFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className={cn('flex flex-col gap-2', wrapperClassName)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div
        className={cn(
          'flex h-12 items-center gap-3 rounded-lg border bg-background/70 px-4 transition-colors focus-within:border-ember focus-within:ring-3 focus-within:ring-ember/15',
          error ? 'border-destructive' : 'border-input',
        )}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {prefix && <span className="border-r border-border pr-3 text-sm font-medium text-foreground">{prefix}</span>}
        <input
          id={id}
          name={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          {...props}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
