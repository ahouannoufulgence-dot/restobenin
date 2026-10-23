import { Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from './logo'

const columns = [
  { title: 'Solutions', links: ['Pour les restaurants', 'Pour les chaînes', 'Pour les tables fines'] },
  { title: 'Ressources', id: 'ressources', links: ['Centre d’aide', 'Blog & Conseils', 'Tutoriels'] },
  { title: 'L’entreprise', id: 'a-propos', links: ['À propos', 'Carrières', 'Nous contacter'] },
]

const socials = [
  {
    label: 'Facebook',
    path: 'M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v9h4v-9h3l1-4h-4V9c0-.6.4-1 1-1Z',
  },
  {
    label: 'Instagram',
    path: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10.5 2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  },
  {
    label: 'LinkedIn',
    path: 'M4 9h3.5v11H4V9Zm1.75-5.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM9.5 9H13v1.6c.5-.9 1.7-1.8 3.5-1.8 3.6 0 4.2 2.3 4.2 5.4V20h-3.5v-5.1c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V20H9.5V9Z',
  },
  {
    label: 'WhatsApp',
    path: 'M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Zm4.9 13.3c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4Z',
  },
]

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-terracotta text-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.7fr] lg:px-10">
        <div>
          <Logo withTagline={false} href="/" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/80">
            RestoBen — L&apos;excellence opérationnelle pour les restaurants béninois.
          </p>
          <ul className="mt-6 flex gap-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href="#"
                  aria-label={s.label}
                  className="flex size-10 items-center justify-center rounded-full bg-cream text-terracotta transition-colors hover:bg-gold"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {columns.map((col) => (
          <nav key={col.title} id={col.id} aria-label={col.title} className="scroll-mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-cream">{col.title}</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-cream/80 transition-colors hover:text-gold">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="lg:border-l lg:border-cream/20 lg:pl-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-cream">Contact</h2>
          <address className="mt-4 flex flex-col gap-3 text-sm not-italic text-cream/80">
            <span className="flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0 text-gold" aria-hidden="true" />
              Cotonou, Bénin
            </span>
            <a href="tel:+2290144767018" className="flex items-center gap-2.5 hover:text-gold">
              <Phone className="size-4 shrink-0 text-gold" aria-hidden="true" />
              +229 01 44 76 70 18
            </a>
            <a href="mailto:ahouannoufulgence@gmail.com" className="flex min-w-0 items-center gap-2.5 hover:text-gold [overflow-wrap:anywhere]">
              <Mail className="size-4 shrink-0 text-gold" aria-hidden="true" />
              ahouannoufulgence@gmail.com
            </a>
          </address>
        </div>
      </div>

      <div className="border-t border-cream/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-xs text-cream/70 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} RestoBen · Yanvar Academy. Tous droits réservés. Fait avec passion pour le Bénin.</p>
          <div className="flex gap-6">
            <a href="/mentions-legales" className="hover:text-gold">Mentions légales</a>
            <a href="/politique-de-confidentialite" className="hover:text-gold">Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
