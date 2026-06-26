import PublicPageLayout from '../layouts/PublicPageLayout'

export default function MentionsLegalesPage() {
  return (
    <PublicPageLayout title="Mentions légales">
      <section className="space-y-2">
        <h2 className="text-base font-extrabold text-slate-900">Éditeur du site</h2>
        <p>Pedagogia Drive</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-extrabold text-slate-900">Activité</h2>
        <p>
          Développement de solutions pédagogiques numériques pour les auto-écoles.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-extrabold text-slate-900">Contact</h2>
        <p>
          <a className="font-semibold text-cyan-700 hover:text-cyan-800" href="mailto:contact@pedagogia-drive.fr">
            contact@pedagogia-drive.fr
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-extrabold text-slate-900">Hébergement</h2>
        <p>OVHcloud</p>
      </section>

      <section className="rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">
          Le site est actuellement en phase de développement et de tests.
        </p>
      </section>
    </PublicPageLayout>
  )
}
