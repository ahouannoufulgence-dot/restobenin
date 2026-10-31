import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SuperAdminPage, type NavKey } from '@/components/superadmin/page-shell'
import { SuperAdminSectionContent } from '@/components/superadmin/sections'
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
      <SuperAdminSectionContent slug={found.slug} description={found.description} />
    </SuperAdminPage>
  )
}
