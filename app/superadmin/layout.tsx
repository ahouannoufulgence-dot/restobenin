import type { Metadata } from 'next'

// L'espace Super Admin ne doit jamais apparaître dans les moteurs de recherche.
export const metadata: Metadata = {
  title: 'RestoBen Super Admin',
  robots: { index: false, follow: false },
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
