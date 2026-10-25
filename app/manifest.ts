import type { MetadataRoute } from 'next'

// Permet d'ajouter RestoBen à l'écran d'accueil du téléphone, avec sa propre icône et en plein écran.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RestoBen Manager',
    short_name: 'RestoBen',
    description: 'La gestion de votre restaurant : commandes, cuisine, caisse, tables, menu et rapports.',
    lang: 'fr',
    start_url: '/gerant',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#2a1a12',
    theme_color: '#160c07',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
