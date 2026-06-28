import { useMemo } from 'react'
import PublicPageLayout from '../layouts/PublicPageLayout'
import PageSeo from '../components/seo/PageSeo'
import { SEO_PAGES, breadcrumbsForPage, buildBreadcrumbJsonLd } from '../lib/seo'

export default function ConfidentialitePage() {
  const jsonLd = useMemo(
    () => buildBreadcrumbJsonLd(breadcrumbsForPage('confidentialite')),
    [],
  )

  return (
    <>
      <PageSeo {...SEO_PAGES.confidentialite} jsonLd={jsonLd} />
      <PublicPageLayout title="Politique de confidentialité">
        <p>
          Pedagogia Drive collecte uniquement les données nécessaires au fonctionnement
          de la plateforme :
        </p>

        <ul className="list-disc space-y-2 pl-5">
          <li>Nom</li>
          <li>Prénom</li>
          <li>Adresse e-mail</li>
          <li>Données pédagogiques liées à la formation</li>
        </ul>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-slate-900">Utilisation des données</h2>
          <p>Les données sont utilisées uniquement pour :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>La gestion des élèves</li>
            <li>Le suivi pédagogique</li>
            <li>La communication entre utilisateurs</li>
            <li>L&apos;amélioration des services</li>
          </ul>
        </section>

        <p>Les données ne sont jamais revendues à des tiers.</p>

        <p>
          Chaque utilisateur peut demander la suppression de ses données conformément au RGPD
          en écrivant à{' '}
          <a className="font-semibold text-cyan-700 hover:text-cyan-800" href="mailto:contact@pedagogia-drive.fr">
            contact@pedagogia-drive.fr
          </a>
          .
        </p>
      </PublicPageLayout>
    </>
  )
}
