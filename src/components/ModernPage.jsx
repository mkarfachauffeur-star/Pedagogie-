import { useMemo, useState } from 'react'

const toneStyles = {
  cyan: {
    card: 'border-cyan-100 bg-cyan-50/70',
    badge: 'bg-cyan-100 text-cyan-700 ring-cyan-200',
    dot: 'bg-cyan-500',
    progress: 'from-cyan-600 to-cyan-400',
  },
  navy: {
    card: 'border-slate-200 bg-slate-50',
    badge: 'bg-navy-900 text-white ring-navy-800',
    dot: 'bg-navy-700',
    progress: 'from-navy-900 to-cyan-600',
  },
  emerald: {
    card: 'border-emerald-100 bg-emerald-50/70',
    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    progress: 'from-emerald-600 to-emerald-400',
  },
  amber: {
    card: 'border-amber-100 bg-amber-50/70',
    badge: 'bg-amber-100 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
    progress: 'from-amber-500 to-orange-400',
  },
  rose: {
    card: 'border-rose-100 bg-rose-50/70',
    badge: 'bg-rose-100 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
    progress: 'from-rose-500 to-pink-400',
  },
  violet: {
    card: 'border-violet-100 bg-violet-50/70',
    badge: 'bg-violet-100 text-violet-700 ring-violet-200',
    dot: 'bg-violet-500',
    progress: 'from-violet-500 to-indigo-400',
  },
}

function getTone(tone = 'cyan') {
  return toneStyles[tone] || toneStyles.cyan
}

function ActionButton({ children, variant = 'primary', onClick }) {
  return (
    <button
      className={
        variant === 'secondary'
          ? 'rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15'
          : 'rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-extrabold text-navy-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-300'
      }
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ProgressBar({ value = 0, tone = 'cyan' }) {
  const styles = getTone(tone)

  return (
    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${styles.progress}`}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function Hero({ hero, onAction }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
      <div className="grid gap-6 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:grid-cols-[1fr_auto] md:p-8">
        <div>
          {hero.eyebrow && (
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
              {hero.eyebrow}
            </span>
          )}
          <h1 className="mt-5 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            {hero.title}
          </h1>
          {hero.subtitle && (
            <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50/85">{hero.subtitle}</p>
          )}
          {hero.actions?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {hero.actions.map((action) => (
                <ActionButton
                  key={action.label}
                  onClick={() => onAction(action)}
                  variant={action.variant}
                >
                  {action.label}
                </ActionButton>
              ))}
            </div>
          )}
        </div>

        {hero.focus && (
          <aside className="min-w-64 rounded-[1.5rem] border border-white/15 bg-white p-5 text-slate-900 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {hero.focus.label}
            </p>
            <p className="mt-1 text-5xl font-black text-cyan-600">{hero.focus.value}</p>
            {hero.focus.progress != null && <ProgressBar value={hero.focus.progress} />}
            <p className="mt-4 text-sm leading-6 text-slate-500">{hero.focus.caption}</p>
          </aside>
        )}
      </div>
    </section>
  )
}

function Metrics({ metrics = [], activeDetail, onSelect }) {
  if (!metrics.length) return null

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const styles = getTone(metric.tone)
        const active = activeDetail?.id === `metric-${metric.label}`

        return (
          <button
            className={`rounded-[1.5rem] border bg-white p-5 text-left shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)] focus:outline-none focus:ring-4 focus:ring-cyan-200 ${styles.card} ${
              active ? 'ring-4 ring-cyan-200' : ''
            }`}
            key={`${metric.label}-${metric.value}`}
            onClick={() =>
              onSelect({
                id: `metric-${metric.label}`,
                title: metric.label,
                subtitle: metric.value,
                description: metric.trend || 'Indicateur disponible pour le suivi opérationnel.',
                tone: metric.tone,
                meta: [
                  { label: 'Valeur', value: metric.value },
                  { label: 'Tendance', value: metric.trend || 'Stable' },
                ],
              })
            }
            type="button"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{metric.value}</p>
              </div>
              <span className={`mt-1 h-3 w-3 rounded-full ${styles.dot}`} />
            </div>
            {metric.trend && (
              <p className="mt-4 text-sm font-semibold text-slate-500">{metric.trend}</p>
            )}
          </button>
        )
      })}
    </section>
  )
}

function CardSection({ section, activeDetail, onSelect }) {
  return (
    <section>
      <SectionHeader section={section} />
      <div className={`grid gap-4 ${section.columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {section.items.map((item) => {
          const styles = getTone(item.tone)

          const active = activeDetail?.id === `${section.title}-${item.title}`

          return (
            <button
              className={`rounded-[1.5rem] border bg-white p-5 text-left shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)] focus:outline-none focus:ring-4 focus:ring-cyan-200 ${styles.card} ${
                active ? 'ring-4 ring-cyan-200' : ''
              }`}
              key={`${item.badge || item.title}-${item.title}`}
              onClick={() =>
                onSelect({
                  id: `${section.title}-${item.title}`,
                  title: item.title,
                  subtitle: item.badge || item.status || section.title,
                  description: item.description,
                  tone: item.tone,
                  progress: item.progress,
                  meta: item.meta,
                })
              }
              type="button"
            >
              <div className="flex items-start gap-4">
                <span className={`mt-1 h-3 w-3 rounded-full ${styles.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.badge && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${styles.badge}`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.status && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                        {item.status}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold text-slate-900">{item.title}</h3>
                  {item.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  )}
                </div>
              </div>
              {item.progress != null && <ProgressBar value={item.progress} tone={item.tone} />}
              {item.meta?.length > 0 && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {item.meta.map((meta) => (
                    <div
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                      key={`${item.title}-${meta.label}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {meta.label}
                      </p>
                      <p className="text-sm font-bold text-slate-800">{meta.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function TableSection({ section, activeDetail, onSelect }) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-slate-100 p-5">
        <SectionHeader section={section} compact />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {section.columns.map((column) => (
                <th className="px-5 py-4 font-bold" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {section.rows.map((row, index) => (
              <tr
                className={`transition hover:bg-cyan-50/50 ${
                  activeDetail?.id === `${section.title}-${row[0]}` ? 'bg-cyan-50' : ''
                }`}
                key={`${row[0]}-${index}`}
              >
                <td className="p-0" colSpan={section.columns.length}>
                  <button
                    className="grid w-full grid-cols-2 text-left transition focus:outline-none focus:ring-4 focus:ring-inset focus:ring-cyan-200 sm:grid-cols-4"
                    onClick={() =>
                      onSelect({
                        id: `${section.title}-${row[0]}`,
                        title: row[0],
                        subtitle: section.title,
                        description: `Dossier ouvert : ${row.join(' · ')}`,
                        tone: 'cyan',
                        meta: section.columns.map((column, columnIndex) => ({
                          label: column,
                          value: row[columnIndex],
                        })),
                      })
                    }
                    type="button"
                  >
                    {row.map((cell, cellIndex) => (
                      <span
                        className={`px-5 py-4 ${
                          cellIndex === 0 ? 'font-extrabold text-slate-900' : 'text-slate-600'
                        }`}
                        key={`${cell}-${cellIndex}`}
                      >
                        {cell}
                      </span>
                    ))}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TimelineSection({ section, activeDetail, onSelect }) {
  return (
    <section>
      <SectionHeader section={section} />
      <div className="grid gap-3">
        {section.items.map((item) => {
          const styles = getTone(item.tone)

          const active = activeDetail?.id === `${section.title}-${item.time}-${item.title}`

          return (
            <button
              className={`flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-4 text-left shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[var(--shadow-card)] focus:outline-none focus:ring-4 focus:ring-cyan-200 sm:flex-row sm:items-center ${
                active ? 'border-cyan-300 ring-4 ring-cyan-100' : ''
              }`}
              key={`${item.time}-${item.title}`}
              onClick={() =>
                onSelect({
                  id: `${section.title}-${item.time}-${item.title}`,
                  title: item.title,
                  subtitle: item.time,
                  description: item.description,
                  tone: item.tone,
                  meta: [
                    { label: 'Horaire', value: item.time },
                    { label: 'Statut', value: item.status || 'À suivre' },
                  ],
                })
              }
              type="button"
            >
              <div className={`rounded-2xl px-4 py-3 text-center ring-1 ${styles.badge}`}>
                <p className="text-sm font-black">{item.time}</p>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
              {item.status && (
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {item.status}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function SectionHeader({ section, compact = false }) {
  return (
    <div className={compact ? '' : 'mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end'}>
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">{section.title}</h2>
        {section.description && <p className="mt-1 text-sm text-slate-500">{section.description}</p>}
      </div>
      {section.badge && (
        <span className="w-fit rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-bold text-cyan-700 shadow-sm">
          {section.badge}
        </span>
      )}
    </div>
  )
}

function DetailPanel({ detail, onClose }) {
  const [actionForm, setActionForm] = useState({
    responsible: '',
    dueDate: '',
    priority: 'Normale',
    note: '',
    saved: false,
  })

  if (!detail) return null
  const styles = getTone(detail.tone)
  const isAction = detail.subtitle === 'Action simulée'

  const updateActionForm = (field, value) => {
    setActionForm((current) => ({ ...current, [field]: value, saved: false }))
  }

  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)] animate-slide-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${styles.badge}`}>
            {detail.subtitle || 'Détail'}
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-slate-950">{detail.title}</h2>
          {detail.description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{detail.description}</p>
          )}
        </div>
        <button
          className="w-fit rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
          onClick={onClose}
          type="button"
        >
          Fermer
        </button>
      </div>

      {detail.progress != null && <ProgressBar value={detail.progress} tone={detail.tone} />}

      {detail.meta?.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {detail.meta.map((meta) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={meta.label}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{meta.label}</p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">{meta.value}</p>
            </div>
          ))}
        </div>
      )}

      {isAction && (
        <form
          className="mt-5 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/60 p-4"
          onSubmit={(event) => {
            event.preventDefault()
            setActionForm((current) => ({ ...current, saved: true }))
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Responsable</span>
              <input
                className="mt-2 min-h-11 w-full rounded-2xl border border-cyan-100 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                onChange={(event) => updateActionForm('responsible', event.target.value)}
                placeholder="Nom du collaborateur"
                value={actionForm.responsible}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Échéance</span>
              <input
                className="mt-2 min-h-11 w-full rounded-2xl border border-cyan-100 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                onChange={(event) => updateActionForm('dueDate', event.target.value)}
                type="date"
                value={actionForm.dueDate}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Priorité</span>
              <select
                className="mt-2 min-h-11 w-full rounded-2xl border border-cyan-100 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                onChange={(event) => updateActionForm('priority', event.target.value)}
                value={actionForm.priority}
              >
                <option>Normale</option>
                <option>Urgente</option>
                <option>À planifier</option>
              </select>
            </label>
            <label className="block md:col-span-3">
              <span className="text-sm font-bold text-slate-700">Note administrative</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                onChange={(event) => updateActionForm('note', event.target.value)}
                placeholder="Ajoutez une consigne, une relance ou un commentaire..."
                value={actionForm.note}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold text-cyan-800">
              {actionForm.saved
                ? 'Action enregistrée en démo, prête à être branchée sur une API.'
                : 'Remplissez les champs puis validez laction.'}
            </p>
            <button
              className="rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-700"
              type="submit"
            >
              Valider laction
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function renderSection(section, activeDetail, onSelect) {
  if (section.type === 'table') {
    return (
      <TableSection
        activeDetail={activeDetail}
        key={section.title}
        onSelect={onSelect}
        section={section}
      />
    )
  }
  if (section.type === 'timeline') {
    return (
      <TimelineSection
        activeDetail={activeDetail}
        key={section.title}
        onSelect={onSelect}
        section={section}
      />
    )
  }
  return (
    <CardSection
      activeDetail={activeDetail}
      key={section.title}
      onSelect={onSelect}
      section={section}
    />
  )
}

export default function ModernPage({ config }) {
  const firstDetail = useMemo(() => {
    const firstSection = config.sections?.[0]
    const firstItem = firstSection?.items?.[0]
    if (!firstItem) return null
    return {
      id: `${firstSection.title}-${firstItem.title}`,
      title: firstItem.title,
      subtitle: firstItem.badge || firstItem.status || firstSection.title,
      description: firstItem.description,
      tone: firstItem.tone,
      progress: firstItem.progress,
      meta: firstItem.meta,
    }
  }, [config])
  const [activeDetail, setActiveDetail] = useState(firstDetail)

  const handleAction = (action) => {
    setActiveDetail({
      id: `action-${action.label}`,
      title: action.label,
      subtitle: 'Action simulée',
      description:
        'Cette action est prête pour une intégration backend. En mode démonstration, elle ouvre un panneau de suivi interactif.',
      tone: action.variant === 'secondary' ? 'navy' : 'cyan',
      meta: [
        { label: 'Statut', value: 'Disponible en démo' },
        { label: 'Interface', value: 'Interactive' },
      ],
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <Hero hero={config.hero} onAction={handleAction} />
      <Metrics activeDetail={activeDetail} metrics={config.metrics} onSelect={setActiveDetail} />
      <DetailPanel detail={activeDetail} onClose={() => setActiveDetail(null)} />
      {config.sections?.map((section) => renderSection(section, activeDetail, setActiveDetail))}
    </div>
  )
}
