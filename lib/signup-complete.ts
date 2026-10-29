import type { AccountData } from '@/components/inscription/account-step'
import { type Account, formatPhoneBJ, saveAccount } from './account-store'
import { openSession } from './auth'
import { getSupabase, supabaseConfigured } from './supabase/client'
import { hydrate } from './supabase/hydrate'
import { friendlyError, resetRemote, setRemote } from './supabase/runtime'
import { employeesActions } from './employees-store'
import type { Billing, PlanId } from './plans'
import { getSettings, saveSettings } from './settings-store'

/**
 * Appelée une fois le paiement validé : relie les informations d'inscription au reste de l'application.
 *  - compte (restaurant, responsable, formule…) → écran Abonnement, bandeau du menu, accueil ;
 *  - paramètres → nom et téléphone du restaurant (reçus, espace client, QR codes, rapports PDF) ;
 *  - employés → le responsable est le premier membre de l'équipe, avec le rôle Gérant ;
 *  - session → le responsable est connecté à son espace.
 * Le mot de passe saisi n'est conservé nulle part.
 */
export async function completeSignup(data: AccountData, planId: PlanId, billing: Billing, paymentMethod: string): Promise<string | null> {
  if (supabaseConfigured) return completeRemoteSignup(data, planId, billing, paymentMethod)
  return completeLocalSignup(data, planId, billing, paymentMethod) ? null : 'Enregistrement impossible : le stockage du navigateur est plein.'
}

/** Mode base de données : la fonction `create_restaurant` crée tout (restaurant, gérant, droits, tables, facture). */
async function completeRemoteSignup(data: AccountData, planId: PlanId, billing: Billing, paymentMethod: string): Promise<string | null> {
  const sb = getSupabase()
  const { data: userData } = await sb.auth.getUser()
  const user = userData.user
  if (!user) return 'Votre session a expiré. Reconnectez-vous puis reprenez l’inscription.'
  const { data: restaurantId, error } = await sb.rpc('create_restaurant', {
    p_name: data.restaurant.trim().replace(/\s+/g, ' '),
    p_establishment: data.establishment,
    p_manager: data.manager.trim().replace(/\s+/g, ' '),
    p_phone: formatPhoneBJ(data.phone),
    p_plan_id: planId,
    p_billing: billing,
    p_payment_method: paymentMethod,
  })
  if (error || !restaurantId) return friendlyError(error?.message)
  const { data: me, error: meError } = await sb.from('staff').select('id').eq('restaurant_id', restaurantId).eq('user_id', user.id).single()
  if (meError || !me) return 'Votre restaurant est créé, mais le chargement a échoué. Connectez-vous pour continuer.'
  setRemote({ restaurantId: restaurantId as string, userId: user.id, staffId: me.id as string })
  if (!(await hydrate())) {
    resetRemote()
    return 'Votre restaurant est créé, mais le chargement a échoué. Connectez-vous pour continuer.'
  }
  openSession({ identifier: user.email ?? data.email.trim().toLowerCase(), role: 'gerant', name: data.manager.trim(), at: Date.now(), restaurantId: restaurantId as string, staffId: me.id as string }, true)
  return null
}

function completeLocalSignup(data: AccountData, planId: PlanId, billing: Billing, paymentMethod: string): boolean {
  const account: Account = {
    restaurant: data.restaurant.trim().replace(/\s+/g, ' '),
    manager: data.manager.trim().replace(/\s+/g, ' '),
    email: data.email.trim().toLowerCase(),
    phone: formatPhoneBJ(data.phone),
    establishment: data.establishment,
    planId,
    billing,
    paymentMethod,
    createdAt: Date.now(),
  }
  if (!saveAccount(account)) return false

  saveSettings({ ...getSettings(), restaurantName: account.restaurant, phone: account.phone })
  employeesActions.replaceAll([
    { id: 'e-gerant', name: account.manager, role: 'gerant', phone: account.phone, email: account.email, status: 'actif' },
  ])
  openSession({ identifier: account.email, role: 'gerant', name: account.manager, at: Date.now() }, true)
  return true
}
