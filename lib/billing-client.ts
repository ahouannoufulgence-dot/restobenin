import type { Billing, PlanId } from './plans'
import { getRemote } from './supabase/runtime'
import { getSupabase } from './supabase/client'

export type Checkout = { ok: true; url: string } | { ok: false; error: string }

/**
 * Ouvre le paiement de l'abonnement chez FedaPay. Le serveur calcule le prix : on n'envoie que la formule et le rythme.
 * En cas de succès, renvoie l'adresse de la page de paiement (le client y choisit son opérateur Mobile Money).
 */
export async function startCheckout(planId: PlanId, billing: Billing): Promise<Checkout> {
  const remote = getRemote()
  if (!remote) return { ok: false, error: 'Connectez-vous pour payer votre abonnement.' }
  try {
    const { data } = await getSupabase().auth.getSession()
    const token = data.session?.access_token
    if (!token) return { ok: false, error: 'Votre session a expiré : reconnectez-vous.' }
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ restaurantId: remote.restaurantId, planId, billing }),
    })
    const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
    if (!res.ok || !body?.url) return { ok: false, error: body?.error ?? 'Paiement impossible pour le moment. Réessayez dans un instant.' }
    // On ne suit que des adresses de FedaPay : une réponse inattendue ne doit jamais rediriger ailleurs.
    const host = new URL(body.url).hostname
    if (!/(^|\.)fedapay\.com$/.test(host)) return { ok: false, error: 'Réponse inattendue du service de paiement.' }
    return { ok: true, url: body.url }
  } catch {
    return { ok: false, error: 'Connexion impossible. Vérifiez votre connexion Internet.' }
  }
}
