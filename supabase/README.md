# Base de données RestoBen (Supabase)

Une seule base pour tous les restaurants : chaque ligne métier porte un `restaurant_id` et les **règles d'accès (RLS)**
garantissent qu'un restaurant ne voit que ses propres données. Les droits par fonction (Paramètres > Rôles et accès)
sont appliqués **côté serveur**.

## Branchement

1. Dans Vercel (et en local dans `.env.local`), renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   (voir `.env.example`). Sans ces variables, l'application reste en mode démonstration.
2. Le client est dans `lib/supabase/client.ts` (`getSupabase()`).
3. **Ne jamais** mettre la clé `service_role` ni le mot de passe de la base dans l'application.

## Avancement du branchement de l'application

| Partie | État |
|---|---|
| Connexion gérant / employé (e-mail + mot de passe), inscription avec e-mail confirmé, activation de l'accès employé | **Branché** |
| Fiche du restaurant, paramètres, équipe, droits par fonction, abonnement et facture | **Branché** |
| Menu et photos | **Branché** |
| Tables, commandes, cuisine, caisse et rapports (90 derniers jours) | **Branché** (les commandes sont relues toutes les 8 secondes) |
| Stock (articles, entrées et sorties) | **Branché** |
| Espace client (QR code), suivi de commande et avis | **Branché** (le QR code contient l'identifiant du restaurant : `/client?r=<slug>&table=<n>`) |
| Super Admin (tableau de bord, restaurants, abonnements, paiements, support, utilisateurs, formules) | **Branché** (lecture seule, sauf l'état des tickets) |
| Suspendre / réactiver un restaurant, modifier les tarifs depuis le Super Admin | À faire |
| Paiement réel des abonnements | À faire : aujourd'hui un gérant peut changer de formule sans payer |

Sans les variables Supabase, l'application reste en mode démonstration (données d'exemple enregistrées dans le navigateur).
Avec elles, plus aucune donnée d'exemple n'est affichée : chaque restaurant a ses propres données.

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

## Avant le lancement (à vérifier une fois, dans l'ordre)

1. **Offre Supabase** : l'offre gratuite n'a **aucune sauvegarde automatique** et met le projet **en pause après 7 jours
   sans activité**. Pour de vrais restaurants, passez à l'offre **Pro** (sauvegarde quotidienne conservée 7 jours,
   pas de mise en pause). Vérifiez ensuite dans Database > Backups que les sauvegardes apparaissent.
2. **E-mails d'inscription** : le service d'e-mails fourni par défaut n'envoie **qu'aux membres de votre organisation
   Supabase** et à très faible cadence. Un vrai restaurant ne recevrait pas son e-mail de confirmation. Branchez un
   service d'e-mails (Authentication > Emails > SMTP Settings : Brevo, Resend, etc.), puis testez une inscription avec
   une adresse extérieure.
3. **Authentication** : confirmation d'e-mail activée, protection contre les mots de passe compromis activée.
4. **Super Admin** : utilisez un compte distinct de celui d'un restaurant (un super admin contourne certaines protections
   sur son propre restaurant).
5. **Jetons et clés** : ne jamais coller un jeton d'accès ou une clé secrète dans une conversation ou un fichier.
   Un jeton GitHub se crée limité à un seul dépôt et se supprime après usage.

## Sauvegarde manuelle (en complément, ou en attendant l'offre Pro)

Avec l'outil en ligne de commande de Supabase, depuis votre ordinateur (le mot de passe de la base se trouve dans
Project Settings > Database) :

```bash
supabase db dump --db-url "postgresql://postgres:MOT_DE_PASSE@db.<projet>.supabase.co:5432/postgres" -f structure.sql
supabase db dump --db-url "..." --data-only -f donnees.sql
```

La sauvegarde ne contient **pas** les photos (stockage `restaurant-media`) : elles sont à copier à part.
Conservez ces fichiers hors du dépôt GitHub, qui est public.
