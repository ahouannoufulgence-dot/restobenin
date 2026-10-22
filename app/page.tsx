import { Hero } from '@/components/restoben/hero'
import { Pricing } from '@/components/restoben/pricing'
import { SiteFooter } from '@/components/restoben/site-footer'
import { SiteHeader } from '@/components/restoben/site-header'
import { TrustedBy } from '@/components/restoben/trusted-by'

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TrustedBy />
        <Pricing />
      </main>
      <SiteFooter />
    </>
  )
}
