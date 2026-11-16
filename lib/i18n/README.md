# Langues du site (français, anglais, fon)

Le visiteur choisit sa langue avec le bouton en haut de la page d'accueil. Son choix est gardé dans un cookie (`locale`, un an) :
le serveur affiche ensuite directement la page dans cette langue (balise `lang`, titre de l'onglet et description compris).

## Où sont les textes
| Fichier | Rôle |
|---|---|
| `fr.ts` | Le français : **la référence**. Toute nouvelle phrase s'écrit d'abord ici. |
| `en.ts` | L'anglais, complet. |
| `fon.ts` | Le fon, **brouillon à faire relire**. Ne contient que ce qui est traduit. |
| `messages.ts` | La liste des textes (le « modèle » que toutes les langues suivent). |
| `config.ts` | Les langues proposées, leurs noms, le nom du cookie. |

## Compléter ou corriger le fon
Ouvrir `fon.ts`. Pour traduire un texte, l'ajouter au **même endroit** que dans `fr.ts`. **Tout ce qui est absent s'affiche en
français** : on peut donc traduire petit à petit sans rien casser. Pour les listes (formules, liens du pied de page), les éléments
se traduisent dans l'ordre. Le fon est signalé « (bêta) » dans le menu de langue : retirer ce mot dans `config.ts` une fois le texte relu.

## Ajouter une langue
1. Ajouter son code à `LOCALES` et son nom à `LOCALE_NAMES` dans `config.ts`.
2. Créer le fichier de traduction (sur le modèle de `en.ts`) et l'ajouter à `dictionaries` dans `index.ts`.

## Ce qui est traduit aujourd'hui
La page d'accueil (en-tête, présentation, formules et prix, pied de page) et le titre de l'onglet. **Pas encore traduits :** connexion,
inscription, espace du gérant, menu du client (QR code), super admin, pages légales.

## Écrire un nouveau texte dans le code
- Composant serveur : `const { hero } = await getMessages()` (`@/lib/i18n/server`).
- Composant du navigateur : `const { messages } = useI18n()` (`@/components/i18n/locale-provider`).
- Pas de fonction dans les dictionnaires (elles ne passent pas du serveur au navigateur) : écrire `{name}` dans le texte et utiliser `fmt(texte, { name })`.
