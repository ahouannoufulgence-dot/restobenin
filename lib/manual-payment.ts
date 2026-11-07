import type { Billing, PlanId } from './plans'
import { getSupabase } from './supabase/client'
import { friendlyError, getRemote } from './supabase/runtime'

export type PaymentInstructions = { operator: string; phone: string; holder: string; note: string }
export type ManualIntent = { paymentId: string; amount: number; code: string; description: string; instructions: PaymentInstructions }
export type PaymentState = { status: 'en_attente' | 'payee' | 'echec'; submitted: boolean; note: string | null }

/** Le montant est calculé par la base de données : on n'envoie que la formule et le rythme de facturation. */
export async function createManualPayment(planId: PlanId, billing: Billing): Promise<{ ok: true; intent: ManualIntent } | { ok: false; error: string }> {
  const remote = getRemote()
  if (!remote) return { ok: false, error: 'Connectez-vous pour payer votre abonnement.' }
  try {
    const { data, error } = await getSupabase().rpc('create_manual_payment', { p_restaurant: remote.restaurantId, p_plan: planId, p_billing: billing })
    if (error || !data) return { ok: false, error: friendlyError(error?.message) }
    const d = data as { payment_id: string; amount: number; code: string; description: string; instructions: PaymentInstructions }
    return { ok: true, intent: { paymentId: d.payment_id, amount: d.amount, code: d.code, description: d.description, instructions: d.instructions } }
  } catch (e) {
    return { ok: false, error: friendlyError(e instanceof Error ? e.message : String(e)) }
  }
}

/** Le gérant déclare l'envoi. Renvoie un message d'erreur, ou null si la déclaration est enregistrée. */
export async function submitManualPayment(paymentId: string, transactionRef: string, payerPhone: string): Promise<string | null> {
  try {
    const { error } = await getSupabase().rpc('submit_manual_payment', { p_payment: paymentId, p_ref: transactionRef, p_phone: payerPhone })
    return error ? friendlyError(error.message) : null
  } catch (e) {
    return friendlyError(e instanceof Error ? e.message : String(e))
  }
}

export async function getPaymentState(paymentId: string): Promise<PaymentState | null> {
  try {
    const { data, error } = await getSupabase().rpc('payment_state', { p_payment: paymentId })
    return error ? null : (data as PaymentState | null)
  } catch {
    return null
  }
}
