import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { LegalLayout, cardClass, proseClass } from '@/components/restoben/legal-layout'
import { legal } from '@/lib/legal-info'

export const metadata: Metadata = {
  title: 'Politique de confidentialité – RestoBen',
  description: 'Comment RestoBen collecte, utilise et protège vos données personnelles.',
}

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: (
      <>
        <p>
          {legal.company} (« nous ») édite la plateforme {legal.site}, un outil de gestion pour les restaurants : menu, commandes, cuisine, caisse et rapports. Cette politique explique quelles données
          nous traitons, pourquoi, et quels sont vos droits. Elle s’adresse aux restaurateurs qui utilisent {legal.site} et à leurs clients qui commandent depuis leur table.
        </p>
        <p>Nous traitons vos données conformément à la législation béninoise en vigueur sur la protection des données personnelles, notamment le Code du numérique.</p>
      </>
    ),
  },
  {
    id: 'donnees',
    title: 'Données que nous collectons',
    body: (
      <ul>
        <li>
          <strong>Compte du restaurateur :</strong> nom, adresse e-mail, numéro de téléphone, nom et adresse du restaurant, formule choisie.
        </li>
        <li>
          <strong>Données d’activité saisies par le restaurant :</strong> menu (plats, prix, photos), tables, commandes, encaissements, reçus et rapports.
        </li>
        <li>
          <strong>Clients à table :</strong> aucun compte n’est demandé. Une commande est rattachée à un numéro de table ; un avis laissé après le repas est facultatif.
        </li>
        <li>
          <strong>Paiement :</strong> nous ne stockons jamais de numéro de carte bancaire ni de code secret. Les paiements en ligne sont confiés à un prestataire de paiement.
        </li>
        <li>
          <strong>Données techniques :</strong> type de navigateur et d’appareil, pages consultées, statistiques de fréquentation.
        </li>
      </ul>
    ),
  },
  {
    id: 'utilisation',
    title: 'Utilisation de vos données',
    body: (
      <ul>
        <li>Fournir le service : afficher le menu, transmettre les commandes à la cuisine, encaisser et produire les rapports.</li>
        <li>Créer et sécuriser votre compte, et vous assister en cas de problème.</li>
        <li>Facturer les abonnements et respecter nos obligations légales, comptables et fiscales.</li>
        <li>Améliorer {legal.site} grâce à des statistiques d’usage agrégées.</li>
      </ul>
    ),
  },
  {
    id: 'partage',
    title: 'Partage des données',
    body: (
      <>
        <p>Nous ne vendons pas vos données. Nous ne les partageons qu’avec :</p>
        <ul>
          <li>
            notre hébergeur technique, {legal.host.name}, qui fait fonctionner le service ;
          </li>
          <li>nos prestataires de paiement, uniquement pour traiter les paiements ;</li>
          <li>les autorités compétentes, lorsque la loi nous y oblige.</li>
        </ul>
        <p>Les données d’un restaurant (commandes, ventes) ne sont visibles que par ce restaurant et son équipe.</p>
      </>
    ),
  },
  {
    id: 'securite',
    title: 'Sécurité',
    body: (
      <p>
        Nous protégeons vos données par des moyens techniques et organisationnels adaptés : connexion chiffrée (HTTPS), accès restreint aux données et hébergement sur une infrastructure sécurisée.
        Aucun système n’étant infaillible, nous vous invitons à choisir des accès confidentiels et à nous signaler toute anomalie.
      </p>
    ),
  },
  {
    id: 'droits',
    title: 'Vos droits',
    body: (
      <>
        <p>Vous pouvez demander à tout moment l’accès à vos données, leur rectification, leur suppression, la limitation ou l’opposition à leur traitement, ainsi que leur portabilité.</p>
        <p>
          Écrivez-nous à <a href={`mailto:${legal.email}`}>{legal.email}</a> ; nous répondons dans un délai raisonnable. Vous pouvez aussi saisir l’autorité béninoise de protection des données
          personnelles si vous estimez que vos droits ne sont pas respectés.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies et stockage local',
    body: (
      <>
        <p>
          {legal.site} n’utilise pas de cookies publicitaires. Le stockage local de votre navigateur sert uniquement au fonctionnement de l’application (menu, commandes en cours, paramètres). Nous
          mesurons l’audience avec un outil de statistiques qui ne dépose pas de cookie de suivi.
        </p>
        <p>Vous pouvez effacer ces données à tout moment depuis les réglages de votre navigateur.</p>
      </>
    ),
  },
  {
    id: 'conservation',
    title: 'Conservation des données',
    body: (
      <p>
        Nous conservons vos données le temps nécessaire aux finalités décrites ci-dessus, notamment pendant la durée de votre abonnement, puis pendant les durées imposées par nos obligations légales
        (comptabilité, fiscalité). Au-delà, elles sont supprimées ou anonymisées.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <>
        <p>Pour toute question sur cette politique ou sur vos données :</p>
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
      </>
    ),
  },
]

export default function PolitiqueDeConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" intro={`Dernière mise à jour : ${legal.updatedAt}`}>
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
            <ShieldCheck className="size-4 shrink-0 text-ember" aria-hidden="true" />
            Votre confiance est notre priorité : nous traitons vos données avec transparence.
          </p>
        </div>
      </div>
    </LegalLayout>
  )
}
