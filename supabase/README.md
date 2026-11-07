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
| Essai gratuit de 20 jours, paiement des abonnements, suspension automatique à l'échéance | **Branché** : paiement manuel par Mobile Money (par défaut) ; FedaPay prêt mais désactivé (voir « Paiement manuel » et « Paiement des abonnements ») |

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

## Paiement des abonnements (FedaPay)

**Fonctionnement.** Un nouveau restaurant a 20 jours d'essai gratuit. À l'échéance, il est suspendu automatiquement
(vérification toutes les 10 minutes) et son gérant voit un écran « Votre période d'accès est terminée » avec le paiement.
Le gérant paie par Mobile Money sur la page FedaPay ; FedaPay prévient notre serveur, qui vérifie la signature, relit la
transaction chez FedaPay, puis la base confirme le paiement (montant comparé au montant attendu, paiement compté une seule
fois) et prolonge l'accès. La période payée commence à la fin de la période déjà acquise : aucun jour d'essai n'est perdu.

**Mise en service (mode test, sans vérification de documents).**
1. FedaPay > mode Test > clés API : copier la clé secrète (`sk_sandbox_…`).
2. FedaPay > Webhooks > créer un point de terminaison :
   - adresse : `https://VOTRE-SITE/api/billing/webhook`
   - événements : `transaction.approved`, `transaction.declined`, `transaction.canceled`
   - copier la clé de signature qu'il affiche (`wh_sandbox_…`).
3. Vercel > Settings > Environment Variables : saisir `FEDAPAY_SECRET_KEY`, `FEDAPAY_WEBHOOK_SECRET`, `FEDAPAY_ENV=sandbox`
   et `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API > service_role), puis **redéployer**.
4. Essayer : un restaurant de test > Abonnement > Payer, avec les numéros de test fournis par FedaPay.

**Passage en mode réel** (après validation du compte FedaPay : documents à remplir et à signer) : remplacer les clés par
les clés `live`, mettre `FEDAPAY_ENV=live`, recréer le point de terminaison de notification en mode réel, redéployer, puis
faire un premier paiement réel de faible montant. Ajouter son numéro de réception (MTN Bénin ou Moov Bénin) dans FedaPay.

**Sécurité.** Le prix est calculé par la base (jamais lu dans la requête). Seul le serveur (clé de service) peut confirmer un
paiement. La signature des notifications est vérifiée avec la bibliothèque officielle, et la transaction est relue chez
FedaPay avant toute confirmation. La clé `service_role` ne doit exister que dans Vercel.

**Dépendance.** La bibliothèque FedaPay embarque axios 0.28, qui a de nombreuses failles connues : `pnpm-workspace.yaml`
force la version corrigée 0.34.0 (`overrides`). À retirer quand FedaPay publiera une mise à jour.

## E-mails d'inscription : envoi vers Gmail (et les autres) avec un code de confirmation

**Pourquoi.** Le service d'e-mails fourni par défaut par Supabase n'envoie qu'aux membres de l'organisation et à très faible
cadence : un vrai restaurant ne recevrait rien. De plus, un lien de confirmation est peu pratique sur téléphone (il s'ouvre dans
un autre navigateur, et les protections de Gmail peuvent même l'« utiliser » avant la personne). L'application demande donc un
**code à saisir** dans la page d'inscription (le lien reste proposé en secours).

**À faire dans Supabase (Authentication), dans cet ordre :**
1. **Emails > SMTP Settings** : activer « Custom SMTP » avec un service d'envoi (Brevo, Resend…). Saisir l'adresse d'expédition,
   le nom d'expéditeur (RestoBen), l'hôte, le port et les identifiants SMTP donnés par le service. Avec un nom de domaine à
   vous, ajouter les enregistrements SPF et DKIM demandés par le service : sans cela, beaucoup de messages arrivent dans les
   courriers indésirables de Gmail. Éviter une adresse d'expédition en @gmail.com : Gmail refuse ou classe en indésirable les
   messages envoyés « au nom » de Gmail par un autre serveur.
2. **Emails > Templates > Confirm signup** : coller le contenu de `supabase/email-templates/confirm-signup.html`
   (il affiche `{{ .Token }}`, le code) et mettre l'objet : « Votre code de confirmation RestoBen ».
3. **Providers > Email** : vérifier que « Confirm email » est activé. La longueur du code (6 à 10 chiffres) et sa durée de
   validité se règlent ici ; l'application accepte 6 à 10 chiffres.
4. **Rate Limits** : après le branchement du SMTP, relever la limite d'e-mails par heure si besoin.
5. Tester avec une adresse Gmail qui n'est pas celle du propriétaire du projet : le message doit arriver avec le code.

**Dans l'application.** Inscription du gérant et activation d'un employé : saisie du code (type `signup`). L'étape « Paiement » de
l'inscription devient « Essai gratuit » (aucun paiement, 20 jours). Le « mot de passe oublié » n'existe pas encore : il suivra
le même principe (code reçu par e-mail).

## Paiement manuel par Mobile Money (mode par défaut)

**Pourquoi.** Un prestataire de paiement exige des documents à imprimer, signer et envoyer avant d'encaisser de vrais
paiements. Le paiement manuel n'en demande aucun : adapté aux premiers restaurants, jusqu'à une vingtaine environ.

**Parcours du gérant** (écran Abonnement, ou écran « Votre période d'accès est terminée ») : il choisit sa formule, voit le
montant exact (calculé par la base) et votre numéro, envoie l'argent depuis son téléphone, puis saisit le numéro de transaction
du SMS et le numéro qui a payé. Un même numéro de transaction ne peut servir qu'une fois.

**Votre parcours** (Super Admin) :
1. **Paramètres > « Où les restaurants vous paient »** : saisir une première fois votre numéro MTN ou Moov, le nom du titulaire
   et une consigne. Tant que ce n'est pas fait, personne ne peut payer. Le numéro n'est écrit ni dans le code ni sur GitHub.
2. **Paiements > « Paiements à valider »** (compteur sur le tableau de bord) : pour chaque demande, vérifiez dans votre
   application Mobile Money que le numéro de transaction figure dans vos messages, puis cliquez sur **Valider** en saisissant le
   montant réellement reçu (la base refuse un montant différent). L'accès est prolongé tout de suite ; un restaurant suspendu
   pour fin de période est réactivé. **Refuser** permet d'indiquer un motif, montré au gérant.
3. Chaque validation ou refus est inscrit dans le journal des actions.

**Sécurité.** Seul le Super Admin peut valider. Le gérant ne peut ni valider son paiement, ni modifier vos coordonnées, ni
réutiliser une preuve de paiement. Vérifiez toujours le SMS : un numéro de transaction saisi par un gérant est une déclaration,
pas une preuve.

**Passer au paiement automatique plus tard** : une fois le compte FedaPay vérifié, suivre « Paiement des abonnements »,
puis mettre `NEXT_PUBLIC_PAYMENT_PROVIDER=fedapay` dans Vercel et redéployer. Tout le reste (essai, expiration, factures,
suspension) est commun aux deux modes.
