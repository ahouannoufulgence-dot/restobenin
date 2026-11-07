/**
 * Mode de paiement des abonnements.
 *  - « manual » (par défaut) : le gérant envoie l'argent par Mobile Money au numéro de RestoBen, saisit le numéro de
 *    transaction, et le Super Admin vérifie son SMS puis valide. Aucun prestataire, aucun document à fournir.
 *  - « fedapay » : paiement automatique (compte FedaPay vérifié et clés dans Vercel, voir supabase/README.md).
 * Se règle avec la variable NEXT_PUBLIC_PAYMENT_PROVIDER.
 */
export const PAYMENT_PROVIDER: 'manual' | 'fedapay' = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'fedapay' ? 'fedapay' : 'manual'
