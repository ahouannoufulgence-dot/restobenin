import { NextResponse, type NextRequest } from 'next/server'
import { Transaction, Webhook } from 'fedapay'
import { BillingError, UUID, adminClient, configureFedaPay } from '@/lib/billing/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const reply = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status })

// Erreurs « définitives » de la base : réessayer ne changerait rien, on répond 200 pour que FedaPay n'insiste pas.
const PERMANENT = ['Montant reçu', 'Référence de transaction inattendue', 'Paiement introuvable']

/**
 * Notifications FedaPay. Trois protections :
 *  1. la signature (clé du point de terminaison, avec horodatage anti-rejeu) est vérifiée sur le corps brut ;
 *  2. on ne se fie jamais au contenu reçu : la transaction est relue chez FedaPay avec notre clé secrète ;
 *  3. la base compare le montant reçu au montant attendu et ignore un paiement déjà confirmé.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET
  if (!secret) return reply(503, { error: 'webhook non configuré' })

  const raw = await req.text()
  let event: { name?: string; entity?: { id?: number | string }; object_id?: number | string }
  try {
    event = Webhook.constructEvent(raw, req.headers.get('x-fedapay-signature') ?? '', secret)
  } catch {
    return reply(400, { error: 'signature invalide' })
  }

  const name = String(event.name ?? '')
  const transactionId = event.entity?.id ?? event.object_id
  if (!name.startsWith('transaction.') || transactionId === undefined) return reply(200, { ignored: true })

  try {
    configureFedaPay()
    const transaction = await Transaction.retrieve(transactionId)
    const admin = adminClient()

    // Notre demande de paiement : retrouvée par la référence enregistrée à l'ouverture, sinon par les métadonnées.
    const found = await admin.from('subscription_payments').select('id').eq('provider', 'fedapay').eq('provider_ref', String(transaction.id)).maybeSingle()
    const meta = (transaction as unknown as { custom_metadata?: { payment_id?: string } }).custom_metadata?.payment_id
    const paymentId = found.data?.id ?? (meta && UUID.test(meta) ? meta : null)
    if (!paymentId) return reply(200, { ignored: true }) // pas une transaction de RestoBen

    const status = String(transaction.status)
    if (status === 'approved' || status === 'transferred') {
      const confirmed = await admin.rpc('confirm_subscription_payment', {
        p_payment: paymentId,
        p_provider: 'fedapay',
        p_ref: String(transaction.id),
        p_amount: Math.round(Number(transaction.amount)),
      })
      if (confirmed.error) {
        const permanent = PERMANENT.some((m) => confirmed.error.message.startsWith(m))
        console.error('[billing/webhook] confirmation refusée :', confirmed.error.message)
        return reply(permanent ? 200 : 500, { error: 'confirmation refusée' })
      }
    } else if (status === 'declined' || status === 'canceled') {
      await admin.rpc('fail_subscription_payment', { p_payment: paymentId })
    }
    return reply(200, { received: true })
  } catch (e) {
    if (e instanceof BillingError) return reply(e.status, { error: e.message })
    console.error('[billing/webhook]', e instanceof Error ? e.message : 'erreur inconnue')
    return reply(500, { error: 'traitement impossible' }) // FedaPay réessaiera
  }
}
