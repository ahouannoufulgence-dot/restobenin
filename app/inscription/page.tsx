import type { Metadata } from 'next'
import { SignupFlow } from '@/components/inscription/signup-flow'
import { isPlanId } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Inscription – RestoBen',
  description: 'Créez votre compte RestoBen, choisissez votre formule et démarrez la gestion de votre restaurant en quelques minutes.',
}

export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams
  return <SignupFlow initialPlan={isPlanId(plan) ? plan : undefined} />
}
