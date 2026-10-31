import type { Metadata } from 'next'
import { ClientApp } from '@/components/client/client-app'
import { supabaseConfigured } from '@/lib/supabase/client'

export const metadata: Metadata = {
  title: 'Commander à table – RestoBen',
  description: 'Consultez le menu, commandez et suivez votre commande depuis votre table, sans créer de compte.',
}

export default async function ClientPage({ searchParams }: { searchParams: Promise<{ table?: string; r?: string }> }) {
  const { table, r } = await searchParams
  const slug = (r ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60) || undefined
  const clean = (table ?? (slug ? '' : '3')).replace(/[^0-9A-Za-z-]/g, '').slice(0, 4)
  // Avec la base de données, il faut un restaurant et une table : ils viennent du QR code posé sur la table.
  if (supabaseConfigured && (!slug || !clean)) return <ClientApp table="" needsQr />
  return <ClientApp table={clean || '3'} slug={supabaseConfigured ? slug : undefined} />
}
