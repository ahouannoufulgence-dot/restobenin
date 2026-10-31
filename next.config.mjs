/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Les images sont redimensionnées selon l'écran et servies en WebP, puis gardées 30 jours.
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 256, 384],
  },
  async headers() {
    const cache = [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' }]
    // En-têtes de sécurité de base, sur toutes les pages : pas d'affichage du site dans le cadre d'un autre site
    // (détournement de clics), pas de détection de type de fichier trompeuse, adresse complète des pages non
    // transmise aux sites tiers, et caméra / micro / position bloqués (l'application n'en a pas besoin).
    const security = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    ]
    return [
      { source: '/:path*', headers: security },
      { source: '/images/:path*', headers: cache },
      { source: '/icons/:path*', headers: cache },
    ]
  },
}

export default nextConfig
