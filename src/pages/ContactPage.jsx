import { useMemo } from 'react'
import PublicPageLayout from '../layouts/PublicPageLayout'
import PageSeo from '../components/seo/PageSeo'
import { SEO_PAGES, breadcrumbsForPage, buildBreadcrumbJsonLd } from '../lib/seo'

export default function ContactPage() {
  const jsonLd = useMemo(() => buildBreadcrumbJsonLd(breadcrumbsForPage('contact')), [])

  return (
    <>
      <PageSeo {...SEO_PAGES.contact} jsonLd={jsonLd} />
      <PublicPageLayout title="Contact">
        <p>
          Vous souhaitez découvrir Pedagogia Drive ou participer aux tests de la version bêta ?
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-slate-900">Contactez-nous</h2>
          <p>
            <a className="text-lg font-bold text-cyan-700 hover:text-cyan-800" href="mailto:contact@pedagogia-drive.fr">
              contact@pedagogia-drive.fr
            </a>
          </p>
        </section>
      </PublicPageLayout>
    </>
  )
}
