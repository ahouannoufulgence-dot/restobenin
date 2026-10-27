# Base de données RestoBen (Supabase)

Une seule base pour tous les restaurants : chaque ligne métier porte un `restaurant_id` et les **règles d'accès (RLS)**
garantissent qu'un restaurant ne voit que ses propres données. Les droits par fonction (Paramètres > Rôles et accès)
sont appliqués **côté serveur**.

## Branchement

1. Dans Vercel (et en local dans `.env.local`), renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   (voir `.env.example`). Sans ces variables, l'application reste en mode démonstration.
2. Le client est dans `lib/supabase/client.ts` (`getSupabase()`).
3. **Ne jamais** mettre la clé `service_role` ni le mot de passe de la base dans l'application.

## Tables (schéma `public`)

| Table | Rôle |
|---|---|
| `plans` | Basique / Standard / Premium : prix mensuel et limite d'équipe (`team_limit`, null = illimité) |
| `restaurants` | Fiche du restaurant : nom, `slug` (adresse publique des QR codes), coordonnées, formule, facturation, frais de service |
| `staff` | Employés (gérant, chef, cuisinier, serveur, caissier, stockiste), statut actif/congé, lien avec `auth.users` |
| `role_permissions` | Modules accessibles par fonction, droits « prendre des commandes » et « modifier le menu » |
| `dining_tables` | Tables de la salle (numéro, places, état) |
| `menu_items` | Plats (prix, catégorie, photo, disponibilité) |
| `orders` / `order_items` | Commandes et leurs lignes (prix figés au moment de la commande) |
| `payments` | Encaissement d'une commande (mode, montant reçu, monnaie rendue) |
| `reviews` | Avis du client après son repas |
| `stock_items` / `stock_movements` | Articles de stock et historique des entrées/sorties |
| `subscription_payments` | Factures d'abonnement |
| `platform_admins` | Comptes Super Admin de la plateforme |
| `support_tickets` | Demandes au support |

Photos : bucket de stockage `restaurant-media` ; le premier dossier du chemin est l'identifiant du restaurant
(ex. `<restaurant_id>/menu/<fichier>.jpg`).

## Fonctions à appeler depuis l'application (`supabase.rpc(...)`)

| Fonction | Utilisation |
|---|---|
| `create_restaurant(...)` | Inscription : crée restaurant, gérant, droits par défaut, 6 tables, première facture |
| `claim_staff()` | À appeler à chaque connexion d'un employé : rattache son compte à sa fiche (e-mail/téléphone **confirmé**) |
| `create_order(restaurant, table, lignes)` | Commande prise par le personnel. Lignes : `[{id, qty}]` ; **les prix viennent de la base** |
| `collect_payment(commande, mode, montant_reçu)` | Encaissement (calcule la monnaie rendue) |
| `record_stock_movement(article, 'entree'/'sortie', qté, note)` | Seul moyen de changer une quantité de stock |
| `change_plan(restaurant, formule, facturation)` | Changement de formule (refusé si l'équipe dépasse la limite) |
| `public_menu(slug)` | Menu public du restaurant (client sans compte) |
| `place_client_order(slug, table, lignes)` | Commande du client qui scanne le QR code (frais de service ajoutés) |
| `track_order(jeton)` / `submit_review(jeton, note, commentaire)` | Suivi et avis du client, via le jeton remis à la commande |
| `admin_overview()` | Chiffres clés pour le Super Admin |

Les statuts de commande ne vont que vers l'avant (`en_attente` → `en_cours` → `pret` → `terminee`, ou `annulee`), avec
horodatage automatique. Le temps réel est activé sur `orders`, `dining_tables` et `stock_items`.

## Créer le premier Super Admin

Après avoir créé votre compte, dans l'éditeur SQL de Supabase :

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'votre-adresse@exemple.com';
```

## À régler dans le tableau de bord Supabase (Authentication)

- **Confirmation d'e-mail** : à activer (nécessaire pour que `claim_staff()` rattache un employé en toute sécurité).
- **Protection contre les mots de passe compromis** (Password security) : à activer si votre offre le permet.
- **URL de redirection** : ajouter l'adresse Vercel du site (Authentication > URL Configuration).
- **Connexion par téléphone** : demande un fournisseur SMS ; sinon l'identifiant de connexion reste l'e-mail.
