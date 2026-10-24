import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Hourglass } from 'lucide-react'
import { SuperAdminPage, type NavKey } from '@/components/superadmin/page-shell'
import { sections } from '@/lib/superadmin-demo'

export function generateStaticParams() {
  return sections.map((s) => ({ section: s.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params
  const found = sections.find((s) => s.slug === section)
  return { title: `${found?.label ?? 'Section'} – RestoBen Super Admin` }
}

export default async function SuperAdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const found = sections.find((s) => s.slug === section)
  if (!found) notFound()
  return (
    <SuperAdminPage title={found.label} current={found.slug as NavKey}>
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)]">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-[#f6e6d3] text-[#b8741a]">
          <Hourglass className="size-7" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-serif text-2xl font-semibold">Section à venir</h2>
        <p className="mt-2 text-foreground/80">{found.description}</p>
        <p className="mt-1 text-sm text-muted-foreground">Elle sera disponible une fois la base de données branchée.</p>
        <Link href="/superadmin" className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Retour au tableau de bord
        </Link>
      </div>
    </SuperAdminPage>
  )
}
