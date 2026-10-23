import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

export function LegalLayout({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <div className="relative h-24 bg-espresso">
        <SiteHeader />
      </div>
      <main className="bg-background">
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-14 lg:px-10">
          <header className="text-center">
            <h1 className="font-serif text-4xl font-semibold text-balance text-foreground sm:text-5xl">{title}</h1>
            <div className="mx-auto mt-5 flex max-w-xs items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-gold/60" />
              <span className="size-2 rotate-45 bg-gold" />
              <span className="h-px flex-1 bg-gold/60" />
            </div>
            {intro && <p className="mt-5 text-sm text-muted-foreground">{intro}</p>}
          </header>
          <div className="mt-12">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}

export const cardClass = 'scroll-mt-6 rounded-2xl border border-border bg-card p-6 shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)] sm:p-7'
export const proseClass = 'space-y-3 text-[15px] leading-relaxed text-foreground/85 [&_a]:font-medium [&_a]:text-ember-deep [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5'
