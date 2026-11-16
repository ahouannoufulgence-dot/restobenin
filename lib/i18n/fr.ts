import type { Messages } from './messages'

export const fr: Messages = {
  meta: {
    title: 'RestoBen – Gestion de restaurant au Bénin',
    description: 'Commandes, stocks, équipes et performances — une seule plateforme pensée pour les restaurateurs exigeants du Bénin.',
  },
  logo: { tagline: 'La gestion élevée au goût près', label: 'RestoBen, accueil' },
  header: {
    nav: { solutions: 'Solutions', features: 'Fonctionnalités', resources: 'Ressources', about: 'À propos', contact: 'Contact' },
    login: 'Se connecter',
    signup: 'Inscrire mon restaurant',
    mainNav: 'Navigation principale',
    mobileNav: 'Navigation mobile',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    changeLanguage: 'Changer de langue, langue actuelle : {name}',
    languageLabel: 'Langue',
  },
  hero: {
    titleStart: 'La gestion de restaurant, élevée au rang ',
    titleEm: 'd’art.',
    text: 'Commandes, stocks, équipes et performances — une seule plateforme pensée pour les restaurateurs exigeants du Bénin.',
    ctaPrimary: 'Démarrer l’expérience',
    ctaSecondary: 'Découvrir la démo',
    rating: '4.9/5',
    ratingText: ' — Plus de 800 établissements nous font confiance au Bénin.',
    features: [
      { title: 'Commandes fluides', text: 'Vos clients commandent en un scan, sans friction.' },
      { title: 'Stocks maîtrisés', text: 'Alertes intelligentes et contrôle total en temps réel.' },
      { title: 'Performance & Prestige', text: 'Analytics précises et avis clients pour briller.' },
    ],
  },
  trust: { title: 'Ils nous font confiance' },
  pricing: {
    title: 'Des solutions pensées pour chaque restaurant',
    subtitle: 'Trois forfaits. Zéro compromis sur l’excellence.',
    featured: 'Le plus choisi',
    perMonth: '/mois',
    choose: 'Choisir {name}',
    plans: {
      basique: {
        name: 'Basique',
        tagline: 'L’essentiel pour bien démarrer',
        features: ['Commandes & Paiements', 'Gestion des stocks basique', 'Équipe (jusqu’à 5 membres)', 'Rapports journaliers', 'Support email'],
      },
      standard: {
        name: 'Standard',
        tagline: 'L’équilibre parfait pour grandir',
        features: ['Tout du Basique', 'Stocks avancés & alertes', 'Équipe (jusqu’à 15 membres)', 'Analytics & performances', 'Avis clients & réputation', 'Support prioritaire'],
      },
      premium: {
        name: 'Premium',
        tagline: 'L’expérience ultime',
        features: ['Tout du Standard', 'Gestion multi-restaurants', 'Équipe illimitée', 'Analytics avancées & prédictives', 'Intégrations & API', 'Support dédié 7j/7'],
      },
    },
  },
  footer: {
    tagline: 'RestoBen — L’excellence opérationnelle pour les restaurants béninois.',
    columns: [
      { title: 'Solutions', links: ['Pour les restaurants', 'Pour les chaînes', 'Pour les tables fines'] },
      { title: 'Ressources', links: ['Centre d’aide', 'Blog & Conseils', 'Tutoriels'] },
      { title: 'L’entreprise', links: ['À propos', 'Carrières', 'Nous contacter'] },
    ],
    contact: 'Contact',
    address: 'Cotonou, Bénin',
    rights: '© {year} RestoBen · Yanvar Academy. Tous droits réservés. Fait avec passion pour le Bénin.',
    legal: { notice: 'Mentions légales', privacy: 'Politique de confidentialité', terms: 'Conditions d’utilisation' },
    admin: 'Administration',
  },
}
