import type { Metadata } from 'next'
import { ClientApp } from '@/components/client/client-app'

export const metadata: Metadata = {
  title: 'Commander à table – RestoBen',
  description: 'Consultez le menu, commandez et suivez votre commande depuis votre table, sans créer de compte.',
}

export default async function ClientPage({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  const { table } = await searchParams
  const clean = (table ?? '3').replace(/[^0-9A-Za-z-]/g, '').slice(0, 4) || '3'
  return <ClientApp table={clean} />
}
