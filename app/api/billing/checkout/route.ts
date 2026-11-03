import { NextResponse, type NextRequest } from 'next/server'
import { Transaction } from 'fedapay'
import { BillingError, UUID, adminClient, configureFedaPay, userClient } from '@/lib/billing/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const fail = (status: number, error: string) => NextResponse.json({ error }, { status })

/**
 * Ouvre un paiement d'abonnement. Le navigateur n'envoie que le restaurant, la formule et le rythme de facturation :
 * le PRIX est calculé par la base de données (create_payment_intent), jamais lu dans la requête.
 */
export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return fail(401, 'Connexion requise.')

  let body: { restaurantId?: unknown; planId?: unknown; billing?: unknown }
  try {
    body = await req.json()
  } catch {
    return fail(400, 'Requête invalide.')
  }
  const { restaurantId, planId, billing } = body
  if (typeof restaurantId !== 'string' || !UUID.test(restaurantId)) return fail(400, 'Restaurant invalide.')
  if (typeof planId !== 'string' || !/^[a-z_-]{2,30}$/.test(planId)) return fail(400, 'Formule invalide.')
  if (billing !== 'mensuel' && billing !== 'annuel') return fail(400, 'Facturation invalide.')

  // 1. Demande de paiement dans la base (droits du gérant, prix et limites vérifiés par la base).
  const intent = await userClient(token).rpc('create_payment_intent', { p_restaurant: restaurantId, p_plan: planId, p_billing: billing })
  if (intent.error || !intent.data) {
    const denied = intent.error?.code === '42501'
    return fail(denied ? 403 : 400, denied ? 'Seul le gérant peut payer l’abonnement.' : intent.error?.message || 'Paiement impossible pour le moment.')
  }
  const { payment_id: paymentId, amount, description } = intent.data as { payment_id: string; amount: number; description: string }

  // 2. Ouverture du paiement chez FedaPay.
  let admin
  try {
    admin = adminClient()
    configureFedaPay()
    const transaction = await Transaction.create({
      description,
      amount,
      currency: { iso: 'XOF' },
      callback_url: `${req.nextUrl.origin}/abonnement/retour?payment=${paymentId}`,
      custom_metadata: { payment_id: paymentId },
    })
    const link = (await transaction.generateToken()) as unknown as { url?: string }
    if (!link.url) throw new Error('Lien de paiement absent de la réponse.')
    const attached = await admin.rpc('attach_provider_ref', { p_payment: paymentId, p_provider: 'fedapay', p_ref: String(transaction.id) })
    if (attached.error) throw new Error(attached.error.message)
    return NextResponse.json({ url: link.url })
  } catch (e) {
    // Le paiement demandé n'a pas pu s'ouvrir : on le marque en échec pour qu'il ne reste pas « en attente ».
    try {
      await (admin ?? adminClient()).rpc('fail_subscription_payment', { p_payment: paymentId })
    } catch {
      /* sans clé de service, la demande restera en attente puis sera ignorée */
    }
    if (e instanceof BillingError) return fail(e.status, e.message)
    console.error('[billing/checkout]', e instanceof Error ? e.message : 'erreur inconnue') // jamais de clé ni de corps de requête dans les journaux
    return fail(502, 'Le service de paiement est momentanément indisponible. Réessayez dans un instant.')
  }
}
