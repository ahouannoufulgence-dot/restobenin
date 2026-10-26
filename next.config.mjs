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
    return [
      { source: '/images/:path*', headers: cache },
      { source: '/icons/:path*', headers: cache },
    ]
  },
}

export default nextConfig
