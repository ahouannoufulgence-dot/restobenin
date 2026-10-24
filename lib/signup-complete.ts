import type { AccountData } from '@/components/inscription/account-step'
import { type Account, formatPhoneBJ, saveAccount } from './account-store'
import { openSession } from './auth'
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
export function completeSignup(data: AccountData, planId: PlanId, billing: Billing, paymentMethod: string): boolean {
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
