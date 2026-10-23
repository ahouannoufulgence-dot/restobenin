import type { Metadata } from 'next'
import { ScrollText } from 'lucide-react'
import { LegalLayout, cardClass, proseClass } from '@/components/restoben/legal-layout'
import { legal } from '@/lib/legal-info'

export const metadata: Metadata = {
  title: 'Conditions d’utilisation – RestoBen',
  description: 'Les règles d’utilisation de la plateforme RestoBen par les restaurateurs et leurs clients.',
}

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'objet',
    title: 'Objet',
    body: (
      <p>
        Les présentes conditions d’utilisation encadrent l’accès et l’usage de la plateforme {legal.site}, éditée par {legal.company}. {legal.site} permet à un restaurant de gérer son menu, ses
        commandes, sa cuisine, sa caisse et ses rapports, et à ses clients de commander depuis leur table en scannant un QR code.
      </p>
    ),
  },
  {
    id: 'acceptation',
    title: 'Acceptation',
    body: (
      <p>
        En créant un compte ou en utilisant {legal.site}, vous acceptez ces conditions. Si vous les refusez, vous ne devez pas utiliser le service. Si vous agissez pour un restaurant, vous déclarez
        avoir le pouvoir de l’engager.
      </p>
    ),
  },
  {
    id: 'compte',
    title: 'Compte et accès',
    body: (
      <ul>
        <li>Les informations fournies à l’inscription doivent être exactes et tenues à jour.</li>
        <li>Vous êtes responsable de la confidentialité de vos accès et de toute activité réalisée avec votre compte.</li>
        <li>Prévenez-nous sans délai si vous pensez que votre compte a été utilisé sans votre accord.</li>
      </ul>
    ),
  },
  {
    id: 'service',
    title: 'Description du service',
    body: (
      <ul>
        <li>
          <strong>Espace gérant :</strong> tableau de bord, commandes, cuisine, caisse avec impression de reçus, tables, menu, rapports et paramètres.
        </li>
        <li>
          <strong>Espace client :</strong> consultation du menu, commande et suivi depuis un QR code de table, sans création de compte.
        </li>
        <li>Le service évolue : nous pouvons ajouter, modifier ou retirer des fonctionnalités.</li>
      </ul>
    ),
  },
  {
    id: 'obligations',
    title: 'Obligations du restaurateur',
    body: (
      <ul>
        <li>Publier des informations exactes : plats, prix, disponibilités, photos.</li>
        <li>Disposer des droits sur les contenus qu’il ajoute (notamment les photos) et ne rien publier d’illicite.</li>
        <li>Respecter la réglementation applicable à son activité : hygiène, affichage des prix, fiscalité, émission des justificatifs de vente.</li>
        <li>Utiliser les reçus édités par {legal.site} conformément à ses obligations comptables et fiscales.</li>
        <li>Ne pas perturber le service, ni tenter d’accéder à des données qui ne sont pas les siennes.</li>
      </ul>
    ),
  },
  {
    id: 'clients',
    title: 'Utilisation par les clients à table',
    body: (
      <p>
        Le client qui scanne un QR code passe commande directement auprès du restaurant. Le contrat de vente (plats, prix, paiement) est conclu entre le client et le restaurant : {legal.company}
        n’est pas partie à cette vente et n’est pas responsable de la préparation, de la qualité ou du service des plats.
      </p>
    ),
  },
  {
    id: 'abonnement',
    title: 'Abonnement et paiement',
    body: (
      <>
        <p>
          L’accès à {legal.site} est proposé selon des formules d’abonnement dont les tarifs sont affichés sur la page Tarifs du site. L’abonnement est souscrit pour la durée choisie (mensuelle
          ou annuelle) et se paie à l’avance.
        </p>
        <p>Le restaurateur peut mettre fin à son abonnement à l’issue de la période en cours. Les modalités de paiement et, le cas échéant, de remboursement sont précisées lors de la souscription.</p>
      </>
    ),
  },
  {
    id: 'disponibilite',
    title: 'Disponibilité du service',
    body: (
      <p>
        Nous mettons tout en œuvre pour que {legal.site} soit accessible en continu, mais des interruptions peuvent survenir (maintenance, incident technique, panne de connexion). Le restaurateur
        reste responsable de prévoir une solution de repli pour prendre ses commandes si le service est indisponible.
      </p>
    ),
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    body: (
      <p>
        {legal.site}, sa marque, son design et son code appartiennent à {legal.company}. L’abonnement donne un droit d’usage personnel, non exclusif et non cessible, pendant sa durée. Les contenus
        ajoutés par le restaurateur restent sa propriété ; il nous autorise à les afficher pour faire fonctionner le service.
      </p>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Responsabilité',
    body: (
      <p>
        {legal.company} est responsable du bon fonctionnement du service dans la limite de ses obligations. Elle ne peut être tenue responsable des dommages indirects (perte d’exploitation, de
        clientèle ou de chiffre d’affaires), des contenus publiés par les restaurateurs, ni des interruptions dues à un fournisseur tiers ou à une panne de connexion internet.
      </p>
    ),
  },
  {
    id: 'donnees',
    title: 'Données personnelles',
    body: (
      <p>
        Le traitement de vos données est décrit dans notre <a href="/politique-de-confidentialite">Politique de confidentialité</a>.
      </p>
    ),
  },
  {
    id: 'modification',
    title: 'Modification des conditions',
    body: (
      <p>
        Nous pouvons mettre à jour ces conditions. La date de dernière mise à jour figure en haut de cette page ; en cas de changement important, nous vous en informons. Continuer à utiliser le
        service après une mise à jour vaut acceptation des nouvelles conditions.
      </p>
    ),
  },
  {
    id: 'droit',
    title: 'Droit applicable et litiges',
    body: <p>Ces conditions sont régies par le droit béninois. En cas de litige, nous cherchons d’abord une solution amiable ; à défaut, les tribunaux compétents du Bénin sont seuls compétents.</p>,
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <ul>
        <li>
          <a href={`mailto:${legal.email}`}>{legal.email}</a>
        </li>
        <li>
          <a href={legal.phoneHref}>{legal.phone}</a>
        </li>
        <li>
          {legal.company}, {legal.address}
        </li>
      </ul>
    ),
  },
]

export default function ConditionsUtilisationPage() {
  return (
    <LegalLayout title="Conditions d’utilisation" intro={`Dernière mise à jour : ${legal.updatedAt}`}>
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:items-start">
        <nav aria-label="Sommaire" className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sommaire</p>
          <ol className="flex flex-col gap-1">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-ember/10 hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-4">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className={cardClass}>
              <h2 id={`${s.id}-title`} className="font-serif text-2xl font-semibold">
                {i + 1}. {s.title}
              </h2>
              <div className={`mt-3 ${proseClass}`}>{s.body}</div>
            </section>
          ))}
          <p className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-sand/70 p-4 text-center text-sm text-foreground/80">
            <ScrollText className="size-4 shrink-0 text-ember" aria-hidden="true" />
            Des questions sur ces conditions ? Écrivez-nous, nous vous répondons.
          </p>
        </div>
      </div>
    </LegalLayout>
  )
}
