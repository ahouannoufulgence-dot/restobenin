import type { Metadata } from 'next'
import { PaymentReturn } from '@/components/abonnement/payment-return'
import { UUID } from '@/lib/billing/uuid'

export const metadata: Metadata = {
  title: 'Paiement de l’abonnement – RestoBen',
  robots: { index: false },
}

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const { payment } = await searchParams
  return <PaymentReturn paymentId={payment && UUID.test(payment) ? payment : null} />
}
