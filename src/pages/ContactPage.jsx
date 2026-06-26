import PublicPageLayout from '../layouts/PublicPageLayout'

export default function ContactPage() {
  return (
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
  )
}
