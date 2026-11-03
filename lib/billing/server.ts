/**
 * Paiement de l'abonnement (FedaPay) : code réservé au SERVEUR (routes /api/billing/*). Ne jamais l'importer
 * depuis un composant : il lit des clés secrètes.
 *
 * Variables d'environnement (à saisir dans Vercel, jamais dans le code ni dans une conversation) :
 *  - FEDAPAY_SECRET_KEY        clé secrète FedaPay (sk_sandbox_… pour les essais, sk_live_… pour les vrais paiements)
 *  - FEDAPAY_WEBHOOK_SECRET    clé de signature des notifications (wh_sandbox_… / wh_live_…)
 *  - FEDAPAY_ENV               « sandbox » (défaut) ou « live »
 *  - SUPABASE_SERVICE_ROLE_KEY clé de service Supabase : seule à pouvoir confirmer un paiement dans la base
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { FedaPay } from 'fedapay'

/** Erreur dont le message peut être montré tel quel à l'utilisateur. */
export class BillingError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
  }
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } }

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new BillingError('Le service n’est pas configuré.', 503)
  return { url, key }
}

/** Accès à la base avec l'identité de l'utilisateur connecté : la base vérifie elle-même ses droits. */
export function userClient(accessToken: string): SupabaseClient {
  const { url, key } = publicConfig()
  return createClient(url, key, { ...noSession, global: { headers: { Authorization: `Bearer ${accessToken}` } } })
}

/** Accès complet à la base (clé de service) : uniquement pour les fonctions que seul le serveur peut appeler. */
export function adminClient(): SupabaseClient {
  const { url } = publicConfig()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new BillingError('Le paiement n’est pas encore activé.', 503)
  return createClient(url, key, noSession)
}

export function configureFedaPay() {
  const key = process.env.FEDAPAY_SECRET_KEY
  if (!key) throw new BillingError('Le paiement n’est pas encore activé.', 503)
  FedaPay.setApiKey(key)
  FedaPay.setEnvironment(process.env.FEDAPAY_ENV === 'live' ? 'live' : 'sandbox')
  // Pour les tests automatiques uniquement : jamais pris en compte en production.
  if (process.env.NODE_ENV !== 'production' && process.env.FEDAPAY_API_BASE) FedaPay.setApiBase(process.env.FEDAPAY_API_BASE)
}

export { UUID } from './uuid'
