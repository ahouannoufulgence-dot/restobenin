import type { Metadata } from 'next'
import { Copyright, Mail, Scale, Server, ShieldCheck, TriangleAlert, UserRound, Building2 } from 'lucide-react'
import { LegalLayout, cardClass, proseClass } from '@/components/restoben/legal-layout'
import { legal } from '@/lib/legal-info'

export const metadata: Metadata = {
  title: 'Mentions légales – RestoBen',
  description: 'Informations légales sur l’éditeur, l’hébergeur et l’utilisation de la plateforme RestoBen.',
}

type Section = { icon: typeof Building2; title: string; body: React.ReactNode } | null

export default function MentionsLegalesPage() {
  const sections: Section[] = [
    {
      icon: Building2,
      title: 'Éditeur du site',
      body: (
        <>
          <p>
            Le site et l’application <strong>{legal.site}</strong> sont édités par <strong>{legal.company}</strong>
            {legal.legalForm ? `, ${legal.legalForm}` : ''}.
          </p>
          <ul>
            <li>Adresse : {legal.address}</li>
            {legal.rccm && <li>RCCM : {legal.rccm}</li>}
            {legal.ifu && <li>IFU : {legal.ifu}</li>}
            {legal.capital && <li>Capital social : {legal.capital}</li>}
            <li>
              Courriel : <a href={`mailto:${legal.email}`}>{legal.email}</a>
            </li>
            <li>
              Téléphone : <a href={legal.phoneHref}>{legal.phone}</a>
            </li>
          </ul>
        </>
      ),
    },
    legal.director
      ? {
          icon: UserRound,
          title: 'Directeur de la publication',
          body: <p>{legal.director}</p>,
        }
      : null,
    {
      icon: Server,
      title: 'Hébergement',
      body: (
        <>
          <p>Le site et l’application sont hébergés par :</p>
          <ul>
            <li>{legal.host.name}</li>
            <li>{legal.host.address}</li>
            <li>
              Site : <a href={legal.host.url} target="_blank" rel="noopener noreferrer">{legal.host.url.replace('https://', '')}</a>
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: Copyright,
      title: 'Propriété intellectuelle',
      body: (
        <p>
          L’ensemble des éléments de {legal.site} (marque, logo, textes, graphismes, interfaces, code) est la propriété de {legal.company}, sauf mention contraire. Toute reproduction,
          représentation ou adaptation, totale ou partielle, sans autorisation écrite préalable est interdite. Les photos et contenus que les restaurateurs ajoutent à leur menu restent leur propriété ;
          ils nous autorisent à les afficher dans le cadre du service.
        </p>
      ),
    },
    {
      icon: TriangleAlert,
      title: 'Responsabilité',
      body: (
        <p>
          {legal.company} s’efforce de fournir des informations exactes et un service disponible, mais ne garantit ni l’absence d’erreur ni un accès ininterrompu. Les restaurateurs restent responsables
          des contenus qu’ils publient (plats, prix, photos) et de l’exactitude de leurs informations. {legal.company} ne saurait être tenue responsable des dommages indirects liés à l’utilisation du service.
        </p>
      ),
    },
    {
      icon: ShieldCheck,
      title: 'Données personnelles',
      body: (
        <p>
          Le traitement de vos données personnelles est détaillé dans notre <a href="/politique-de-confidentialite">Politique de confidentialité</a>, qui précise aussi vos droits d’accès, de
          rectification et de suppression.
        </p>
      ),
    },
    {
      icon: Scale,
      title: 'Droit applicable',
      body: <p>Les présentes mentions légales sont régies par le droit béninois. En cas de litige, et à défaut de solution amiable, les tribunaux compétents du Bénin seront seuls compétents.</p>,
    },
    {
      icon: Mail,
      title: 'Contact',
      body: (
        <>
          <p>Pour toute question concernant le site ou ces mentions légales :</p>
          <ul>
            <li>
              <a href={`mailto:${legal.email}`}>{legal.email}</a>
            </li>
            <li>
              <a href={legal.phoneHref}>{legal.phone}</a>
            </li>
            <li>{legal.address}</li>
          </ul>
        </>
      ),
    },
  ]

  return (
    <LegalLayout title="Mentions légales">
      <ol className="mx-auto flex max-w-3xl flex-col gap-4">
        {sections
          .filter((s): s is NonNullable<Section> => s !== null)
          .map((s, i) => {
            const Icon = s.icon
            return (
              <li key={s.title} className={`${cardClass} flex gap-5`}>
                <span className="mt-0.5 hidden size-12 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember sm:inline-flex">
                  <Icon className="size-6" strokeWidth={1.6} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-2xl font-semibold">
                    {i + 1}. {s.title}
                  </h2>
                  <div className={`mt-2 ${proseClass}`}>{s.body}</div>
                </div>
              </li>
            )
          })}
      </ol>
    </LegalLayout>
  )
}
