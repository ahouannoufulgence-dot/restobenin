import type { ManagerView } from './gerant-data'

/**
 * Contenu de l'aide intégrée (module « Aide & Support »).
 * Chaque article décrit le fonctionnement réel de l'application : à mettre à jour si un écran change.
 */
export type HelpCategory = 'demarrage' | 'commandes' | 'menu' | 'stock' | 'equipe' | 'abonnement' | 'rapports'

export type HelpArticle = {
  id: string
  category: HelpCategory
  question: string
  steps: string[]
  note?: string
  /** Raccourci vers le module concerné. */
  action?: { view: ManagerView; label: string }
  /** Affiché seulement au gérant (un employé n'a pas accès au module concerné). */
  managerOnly?: boolean
  /** Fait partie de la FAQ (questions rapides). */
  faq?: boolean
  /** Affiché dans « Questions populaires », dans cet ordre. */
  popular?: number
}

export const categories: { id: HelpCategory; label: string; description: string }[] = [
  { id: 'demarrage', label: 'Premiers pas', description: 'Connexion et prise en main' },
  { id: 'commandes', label: 'Commandes & caisse', description: 'Commandes, cuisine, caisse, tables' },
  { id: 'menu', label: 'Menu & QR codes', description: 'Plats, photos, QR des tables' },
  { id: 'stock', label: 'Stocks', description: 'Articles, mouvements, alertes' },
  { id: 'equipe', label: 'Équipe', description: 'Employés, rôles et accès' },
  { id: 'rapports', label: 'Rapports', description: 'Ventes et exports PDF' },
  { id: 'abonnement', label: 'Abonnement', description: 'Formule, facturation, compte' },
]

export const articles: HelpArticle[] = [
  {
    id: 'employe-ajouter',
    category: 'equipe',
    question: 'Comment ajouter un employé ?',
    steps: [
      'Ouvrez Plus, puis Employés.',
      'Appuyez sur « Ajouter un employé ».',
      'Renseignez le nom, le rôle, le téléphone et l’adresse e-mail. La photo est facultative.',
      'Appuyez sur « Ajouter ». L’employé apparaît dans la liste, avec le statut Actif.',
    ],
    note: 'Le nombre de membres dépend de votre formule : 5 en Basique, 15 en Standard, illimité en Premium.',
    action: { view: 'employes', label: 'Ouvrir Employés' },
    managerOnly: true,
    faq: true,
    popular: 1,
  },
  {
    id: 'employe-connexion',
    category: 'equipe',
    question: 'Comment un employé se connecte-t-il ?',
    steps: [
      'Sur la page de connexion, l’employé choisit l’onglet « Employé ».',
      'Il saisit l’adresse e-mail ou le téléphone enregistré dans la liste des employés, puis son mot de passe.',
      'Un employé « En congé » ne peut pas se connecter : repassez-le en « Actif » dans Employés.',
    ],
    note: 'Un employé ne voit ni les rapports, ni les paramètres, ni l’abonnement.',
    managerOnly: true,
    faq: true,
  },
  {
    id: 'stocks-gerer',
    category: 'stock',
    question: 'Comment gérer les stocks ?',
    steps: [
      'Ouvrez Plus, puis Stock. Les trois cartes résument le nombre d’articles, les articles en alerte et la valeur totale.',
      'Créez un article avec « Nouvel article » : unité, quantité de départ, seuil d’alerte et prix d’achat.',
      'À chaque livraison ou consommation, appuyez sur « Ajouter un mouvement » et choisissez Entrée ou Sortie.',
      'Surveillez les pastilles : « Stock faible » sous le seuil, « Critique » sous 60 % du seuil.',
    ],
    note: '« Voir l’historique » liste les derniers mouvements. Une sortie supérieure au stock disponible est refusée.',
    action: { view: 'stock', label: 'Ouvrir Stock' },
    faq: true,
    popular: 2,
  },
  {
    id: 'abonnement-modifier',
    category: 'abonnement',
    question: 'Comment modifier mon abonnement ?',
    steps: [
      'Ouvrez Plus, puis Abonnement : vous y voyez votre formule actuelle, son prix et la date du prochain paiement.',
      'Dans « Changer de formule », touchez la formule voulue, puis appuyez sur « Mettre à niveau » (ou « Passer à … » pour une formule inférieure).',
      'Choisissez la facturation mensuelle ou annuelle (−20 %) et confirmez.',
      '« Gérer le paiement » change le moyen de paiement, et « Télécharger la facture » enregistre la facture en PDF.',
    ],
    note: 'Une formule inférieure est refusée si votre équipe compte plus de membres que la limite de cette formule.',
    action: { view: 'abonnement', label: 'Ouvrir Abonnement' },
    managerOnly: true,
    faq: true,
    popular: 3,
  },
  {
    id: 'qr-generer',
    category: 'menu',
    question: 'Comment générer un QR code ?',
    steps: [
      'Ouvrez Plus, puis QR Code (ou Paramètres restaurant).',
      'Renseignez l’« Adresse du site » publique de votre restaurant : sans elle, les QR codes pointent vers l’adresse ouverte dans votre navigateur et ne fonctionneront pas sur le téléphone des clients.',
      'Chaque table a son QR code. Vous pouvez le télécharger ou copier son lien.',
      'Appuyez sur « Imprimer les affiches » pour obtenir une affiche par table.',
    ],
    action: { view: 'qr', label: 'Ouvrir QR Code' },
    managerOnly: true,
    faq: true,
    popular: 4,
  },
  {
    id: 'menu-modifier',
    category: 'menu',
    question: 'Comment ajouter ou modifier un plat ?',
    steps: [
      'Ouvrez Plus, puis Menu.',
      'Appuyez sur « Ajouter un plat », ou sur un plat existant pour le modifier.',
      'Renseignez le nom, la description, le prix et la catégorie, puis ajoutez une photo si vous le souhaitez.',
      'Enregistrez. Un plat marqué « Indisponible » reste dans la carte mais ne peut plus être commandé par les clients.',
    ],
    action: { view: 'menu', label: 'Ouvrir Menu' },
    faq: true,
  },
  {
    id: 'commande-suivre',
    category: 'commandes',
    question: 'Comment suivre et traiter une commande ?',
    steps: [
      'Une commande reçue passe par les statuts En attente, En cours, Prêt, puis Terminée.',
      'La cuisine fait avancer la commande avec « Marquer prête » ; le service utilise « Marquer servie ».',
      'Le tableau de bord, « À traiter maintenant », liste les commandes ouvertes les plus récentes.',
      'Une commande peut être annulée depuis l’écran Commandes.',
    ],
    action: { view: 'commandes', label: 'Ouvrir Commandes' },
    faq: true,
  },
  {
    id: 'vente-comptoir',
    category: 'commandes',
    question: 'Comment enregistrer une vente au comptoir ?',
    steps: [
      'Sur téléphone, appuyez sur le bouton central « Nouvelle commande » de la barre du bas. Sur ordinateur, ouvrez Caisse puis « Nouvelle vente au comptoir ».',
      'Choisissez les plats et les quantités.',
      'Saisissez le montant reçu et appuyez sur « Encaisser ».',
      'Imprimez le reçu (format ticket 80 mm) ou enregistrez-le en PDF depuis la fenêtre d’impression.',
    ],
    action: { view: 'caisse', label: 'Ouvrir Caisse' },
    faq: true,
  },
  {
    id: 'recu-personnaliser',
    category: 'commandes',
    question: 'Comment personnaliser mes reçus ?',
    steps: [
      'Ouvrez Plus, puis Paramètres restaurant.',
      'Dans « Votre restaurant », complétez le nom, l’adresse, le téléphone et le message de bas de reçu.',
      'Enregistrez : les nouveaux reçus utilisent ces informations.',
    ],
    action: { view: 'parametres', label: 'Ouvrir Paramètres' },
    managerOnly: true,
  },
  {
    id: 'tables-occupation',
    category: 'commandes',
    question: 'Comment fonctionne l’occupation des tables ?',
    steps: [
      'Une table passe en « Occupée » dès qu’une commande est ouverte.',
      'Elle redevient « Libre » après l’encaissement de la commande.',
      'Vous pouvez aussi changer l’état d’une table en appuyant dessus, par exemple pour la marquer « Réservée ».',
    ],
    action: { view: 'tables', label: 'Ouvrir Tables' },
  },
  {
    id: 'rapport-exporter',
    category: 'rapports',
    question: 'Comment consulter et exporter un rapport ?',
    steps: [
      'Ouvrez Rapports depuis la barre du bas ou le menu.',
      'Choisissez la période (jour, semaine, mois ou année) et naviguez avec les flèches.',
      'Consultez le chiffre d’affaires, le panier moyen, les ventes par jour et les meilleures performances.',
      'Appuyez sur « Exporter le rapport » pour obtenir un PDF.',
    ],
    note: 'L’historique fictif de démonstration peut être retiré des rapports depuis la bannière en haut de l’écran.',
    action: { view: 'rapports', label: 'Ouvrir Rapports' },
    managerOnly: true,
    faq: true,
  },
  {
    id: 'mot-de-passe',
    category: 'demarrage',
    question: 'J’ai oublié mon mot de passe',
    steps: [
      'Gérant : sur la page de connexion, appuyez sur « Mot de passe oublié ? » : un e-mail est préparé à l’attention du support.',
      'Employé : demandez à votre gérant, qui peut vous aider à définir un nouveau mot de passe.',
    ],
    faq: true,
  },
  {
    id: 'compte-infos',
    category: 'abonnement',
    question: 'Où modifier les informations de mon restaurant ?',
    steps: [
      'Le nom, le téléphone, l’adresse et le message de reçu se modifient dans Plus, Paramètres restaurant.',
      'Les informations du compte (responsable, e-mail, type d’établissement, formule) sont visibles dans Plus, Abonnement, rubrique « Informations du compte ».',
      'Pour corriger l’e-mail ou le nom du responsable, contactez le support.',
    ],
    action: { view: 'parametres', label: 'Ouvrir Paramètres' },
    managerOnly: true,
  },
]

export const guideSteps: { id: string; title: string; description: string; action: { view: ManagerView; label: string }; managerOnly?: boolean }[] = [
  { id: 'resto', title: 'Complétez les informations du restaurant', description: 'Nom, adresse et téléphone apparaissent sur vos reçus.', action: { view: 'parametres', label: 'Paramètres' }, managerOnly: true },
  { id: 'menu', title: 'Composez votre carte', description: 'Ajoutez vos plats avec leurs prix et leurs photos.', action: { view: 'menu', label: 'Menu' } },
  { id: 'equipe', title: 'Ajoutez votre équipe', description: 'Donnez un accès à chaque employé, avec son rôle.', action: { view: 'employes', label: 'Employés' }, managerOnly: true },
  { id: 'qr', title: 'Imprimez les QR codes des tables', description: 'Vos clients commandent en scannant le QR de leur table.', action: { view: 'qr', label: 'QR Code' }, managerOnly: true },
  { id: 'stock', title: 'Renseignez vos stocks', description: 'Créez vos articles et leurs seuils d’alerte.', action: { view: 'stock', label: 'Stock' } },
  { id: 'vente', title: 'Prenez votre première commande', description: 'Testez une vente au comptoir de bout en bout.', action: { view: 'caisse', label: 'Caisse' } },
]

export const plannedVideos = [
  'Prendre en main le tableau de bord',
  'Créer votre menu et ajouter des photos',
  'Générer et imprimer les QR codes',
  'Traiter une commande, de la cuisine à la caisse',
  'Gérer vos stocks et vos alertes',
  'Lire vos rapports et les exporter',
]

/** Temps de réponse moyen affiché à l'écran. À ajuster selon la réalité du support. */
export const SUPPORT_RESPONSE_TIME = '2h'

export const supportSubjects = ['Question sur l’utilisation', 'Problème technique', 'Abonnement ou facturation', 'Autre demande']

/** Met un texte en minuscules sans accents, pour la recherche. */
export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
