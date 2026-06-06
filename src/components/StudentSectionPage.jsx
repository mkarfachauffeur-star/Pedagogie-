import PageHero from './ui/PageHero'
import PageShell from './ui/PageShell'
import EmptyState from './ui/EmptyState'

export default function StudentSectionPage({
  title,
  subtitle,
  icon = '📄',
  message = 'Cette rubrique sera bientôt disponible dans votre espace élève.',
}) {
  return (
    <PageShell>
      <PageHero eyebrow="Espace élève" title={title} subtitle={subtitle} />
      <section className="pd-section-card pd-section-card-body">
        <EmptyState icon={icon} message={message} title={title} />
      </section>
    </PageShell>
  )
}
