const cards = [
  {
    title: 'Compétence 1 · Maîtriser le véhicule',
    points: ['Installation au poste', 'Démarrage progressif', 'Utilisation des commandes', 'Direction précise', 'Arrêt précision'],
  },
  {
    title: 'Compétence 2 · Appréhender la route',
    points: ['Priorités', 'Observation active', 'Intersections', 'Allure adaptée', 'Anticipation des risques'],
  },
  {
    title: 'Compétence 3 · Partager la route',
    points: ['Communication avec usagers', 'Angles morts', 'Dépassements', 'Distance de sécurité', 'Courtoisie'],
  },
  {
    title: 'Compétence 4 · Conduite autonome',
    points: ['Préparation trajet', 'Conduite économique', 'Gestion stress', 'Décision autonome', 'Éco-sécurité'],
  },
]

export default function TeacherResourcesPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          REMC & Conseils enseignants
        </p>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Base pédagogique terrain</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-cyan-50/85">
          Compétences et sous-compétences REMC accessibles rapidement sur mobile, tablette et ordinateur.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {cards.map((card) => (
          <article key={card.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-extrabold text-slate-900">{card.title}</h2>
            <div className="mt-4 grid gap-2">
              {card.points.map((point) => (
                <p key={point} className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
                  {point}
                </p>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
