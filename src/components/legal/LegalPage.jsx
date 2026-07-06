import { useMemo } from 'react'
import PublicPageLayout from '../../layouts/PublicPageLayout'
import PageSeo from '../seo/PageSeo'
import { SEO_PAGES, breadcrumbsForPage, buildPageJsonLd } from '../../lib/seo'
import LegalParagraph from './LegalParagraph'

export default function LegalPage({ seoKey, title, children, intro = null }) {
  const page = SEO_PAGES[seoKey]

  const jsonLd = useMemo(
    () =>
      buildPageJsonLd({
        path: page.path,
        title: page.title,
        description: page.description,
        breadcrumbTrail: breadcrumbsForPage(seoKey),
      }),
    [page.description, page.path, page.title, seoKey],
  )

  return (
    <>
      <PageSeo {...page} jsonLd={jsonLd} />
      <PublicPageLayout showBetaBanner={false} title={title}>
        {intro ? <LegalParagraph>{intro}</LegalParagraph> : null}
        {children}
      </PublicPageLayout>
    </>
  )
}
