import type { Messages } from './messages'

export const en: Messages = {
  meta: {
    title: 'RestoBen – Restaurant management in Benin',
    description: 'Orders, stock, teams and performance — one platform built for demanding restaurateurs in Benin.',
  },
  logo: { tagline: 'Management refined to perfection', label: 'RestoBen, home' },
  header: {
    nav: { solutions: 'Solutions', features: 'Features', resources: 'Resources', about: 'About', contact: 'Contact' },
    login: 'Log in',
    signup: 'Register my restaurant',
    mainNav: 'Main navigation',
    mobileNav: 'Mobile navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    changeLanguage: 'Change language, current language: {name}',
    languageLabel: 'Language',
  },
  hero: {
    titleStart: 'Restaurant management, elevated to an ',
    titleEm: 'art form.',
    text: 'Orders, stock, teams and performance — one platform built for demanding restaurateurs in Benin.',
    ctaPrimary: 'Start the experience',
    ctaSecondary: 'See the demo',
    rating: '4.9/5',
    ratingText: ' — Over 800 establishments trust us in Benin.',
    features: [
      { title: 'Smooth ordering', text: 'Your customers order with one scan, no friction.' },
      { title: 'Stock under control', text: 'Smart alerts and full real-time control.' },
      { title: 'Performance & Prestige', text: 'Accurate analytics and customer reviews to help you shine.' },
    ],
  },
  trust: { title: 'They trust us' },
  pricing: {
    title: 'Solutions designed for every restaurant',
    subtitle: 'Three plans. Zero compromise on excellence.',
    featured: 'Most popular',
    perMonth: '/month',
    choose: 'Choose {name}',
    plans: {
      basique: {
        name: 'Basic',
        tagline: 'The essentials to get started',
        features: ['Orders & Payments', 'Basic stock management', 'Team (up to 5 members)', 'Daily reports', 'Email support'],
      },
      standard: {
        name: 'Standard',
        tagline: 'The perfect balance to grow',
        features: ['Everything in Basic', 'Advanced stock & alerts', 'Team (up to 15 members)', 'Analytics & performance', 'Customer reviews & reputation', 'Priority support'],
      },
      premium: {
        name: 'Premium',
        tagline: 'The ultimate experience',
        features: ['Everything in Standard', 'Multi-restaurant management', 'Unlimited team', 'Advanced & predictive analytics', 'Integrations & API', 'Dedicated support 7 days a week'],
      },
    },
  },
  footer: {
    tagline: 'RestoBen — Operational excellence for Beninese restaurants.',
    columns: [
      { title: 'Solutions', links: ['For restaurants', 'For chains', 'For fine dining'] },
      { title: 'Resources', links: ['Help center', 'Blog & Tips', 'Tutorials'] },
      { title: 'Company', links: ['About', 'Careers', 'Contact us'] },
    ],
    contact: 'Contact',
    address: 'Cotonou, Benin',
    rights: '© {year} RestoBen · Yanvar Academy. All rights reserved. Made with passion for Benin.',
    legal: { notice: 'Legal notice', privacy: 'Privacy policy', terms: 'Terms of use' },
    admin: 'Administration',
  },
}
