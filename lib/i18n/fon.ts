import type { DeepPartial, Messages } from './messages'

/**
 * FON (Fɔngbè) : BROUILLON À FAIRE RELIRE PAR UN LOCUTEUR FON AVANT TOUTE PROMOTION.
 *
 * Ce fichier ne contient que ce qui est traduit. Tout texte absent s'affiche en français (voir `getDictionary`) :
 * pour traduire un texte, il suffit de l'ajouter ici, au même endroit que dans `fr.ts`.
 * Les termes techniques (restaurant, stock, plateforme, commande…) restent volontairement en français, comme dans l'usage courant.
 * Les phrases longues (formules, pied de page, mentions) sont laissées en français tant qu'elles ne sont pas relues.
 */
export const fon: DeepPartial<Messages> = {
  logo: { tagline: 'Gestion ɖò ɖagbe mɛ' },
  header: {
    nav: { features: 'Nǔ e é nɔ wà', resources: 'Alɔdo', about: 'Mǐ ŋú' },
    login: 'Connexion',
    signup: 'Inscrire restaurant ce',
    languageLabel: 'Gbè',
  },
  hero: {
    titleStart: 'Restaurant azɔ̌ kpɔ́nkpɔ́n ɖò ',
    titleEm: 'ɖagbe mɛ.',
    text: 'Commandes, stock, azɔ̌tɔ́ lɛ kpó azɔ̌ nǔ kpɔ́kpɔ́ kpó — plateforme ɖokpó e nyɔ́ na restaurant tɔ́ Bénin tɔn lɛ.',
    ctaPrimary: 'Démarrer',
    ctaSecondary: 'Kpɔ́n démo',
    features: [
      { title: 'Commande nyɔ́nyɔ́', text: 'Ðɔ nǔ ɖò scan ɖokpó jí, xó ɖé ɖě.' },
      { title: 'Stock kpɔ́nkpɔ́n', text: 'Alerte ɖagbe lɛ kpó kpɔ́nkpɔ́n bǐ ɖò hwenu mɛ.' },
      { title: 'Performance & Prestige', text: 'Analytics nyɔ́ kpó avis mɛ lɛ tɔn kpó.' },
    ],
  },
  trust: { title: 'Mɛ e ɖó ayi ɖó mǐ jí lɛ' },
  pricing: {
    title: 'Solutions e nyɔ́ na restaurant ɖokpó ɖokpó',
    subtitle: 'Forfait atɔ́n. Ðɔ ɖě na excellence.',
    featured: 'Gègé ɖè',
    perMonth: '/ɣleti',
    choose: 'Sɔ́ {name}',
  },
  footer: {
    columns: [{ title: 'Solutions' }, { title: 'Alɔdo' }, { title: 'Mǐ ŋú' }],
  },
}
