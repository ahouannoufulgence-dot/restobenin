import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { LocaleProvider } from '@/components/i18n/locale-provider'
import { getDictionary } from '@/lib/i18n'
import { getLocale, getMessages } from '@/lib/i18n/server'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant',
})

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Titre et description dans la langue choisie par le visiteur.
export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getMessages()
  return {
    title: meta.title,
    description: meta.description,
    generator: 'v0.app',
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
      apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    // Sur iPhone : ouverture en plein écran quand l'application est ajoutée à l'écran d'accueil.
    appleWebApp: { capable: true, title: 'RestoBen', statusBarStyle: 'default' },
  }
}

export const viewport: Viewport = {
  themeColor: '#160c07',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={`${cormorant.variable} ${inter.variable}`}>
      <body className="antialiased">
        <LocaleProvider locale={locale} messages={getDictionary(locale)}>
          {children}
        </LocaleProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
