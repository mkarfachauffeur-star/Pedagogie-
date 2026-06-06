import { useMemo, useState } from 'react'
import {
  ASSESSMENT_STEPS,
  RESULT_LEVEL_LABELS,
  computeAssessmentScores,
  recommendHoursFromScore,
} from '../../data/initialAssessmentForm'
import { saveInitialAssessmentStep } from '../../services/initialAssessment'

function StepProgress({ steps, currentIndex }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {steps.map((step, index) => {
        const active = index === currentIndex
        const done = index < currentIndex
        return (
          <li
            className={`rounded-2xl border px-3 py-2 text-xs font-bold ${
              active
                ? 'border-cyan-300 bg-cyan-50 text-cyan-900'
                : done
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-500'
            }`}
            key={step.id}
          >
            <span className="block text-[10px] uppercase tracking-wide opacity-70">Étape {index + 1}</span>
            {step.title}
          </li>
        )
      })}
    </ol>
  )
}

function GeneralFields({ fields, answers, onChange, readOnly }) {
  return (
    <div className="grid gap-3">
      {fields.map((field) => (
        <label className="block text-sm font-bold text-slate-700" key={field.id}>
          {field.label}
          {field.type === 'textarea' ? (
            <textarea
              className="pd-input mt-1 min-h-[96px] w-full"
              disabled={readOnly}
              onChange={(e) => onChange(field.id, e.target.value)}
              value={answers[field.id] || ''}
            />
          ) : (
            <select
              className="pd-input mt-1 w-full"
              disabled={readOnly}
              onChange={(e) => onChange(field.id, e.target.value)}
              value={answers[field.id] || field.options[0]}
            >
              {field.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )}
        </label>
      ))}
    </div>
  )
}

function ScoredItems({ items, answers, onToggle, readOnly }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => {
        const checked = Boolean(answers[item.id])
        return (
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
              checked
                ? item.type === 'positive'
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-rose-200 bg-rose-50'
                : 'border-slate-200 bg-white hover:border-cyan-200'
            } ${readOnly ? 'cursor-default opacity-90' : ''}`}
            key={item.id}
          >
            <input
              checked={checked}
              className="mt-1"
              disabled={readOnly}
              onChange={() => onToggle(item.id, !checked)}
              type="checkbox"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-800">{item.label}</span>
              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-black ${
                item.type === 'positive' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
              >
                {item.type === 'positive' ? `+${item.points}` : `-${item.points}`}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}

function ResultsPanel({ answers }) {
  const scores = useMemo(() => computeAssessmentScores(answers), [answers])
  const recommendation = useMemo(() => recommendHoursFromScore(scores), [scores])

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-700">Score positif</p>
        <p className="mt-1 text-3xl font-black text-emerald-900">{scores.positiveScore}</p>
      </article>
      <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <p className="text-sm font-semibold text-rose-700">Score négatif</p>
        <p className="mt-1 text-3xl font-black text-rose-900">{scores.negativeScore}</p>
      </article>
      <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 sm:col-span-2">
        <p className="text-sm font-semibold text-cyan-700">Résultat final</p>
        <p className="mt-1 text-4xl font-black text-cyan-950">{scores.finalScore}</p>
        <p className="mt-2 text-sm font-bold text-cyan-900">
          {RESULT_LEVEL_LABELS[recommendation.resultLevel]}
        </p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
        <p className="text-sm font-semibold text-slate-500">Volume horaire recommandé</p>
        <p className="mt-1 text-2xl font-black text-slate-950">{recommendation.label}</p>
      </article>
    </div>
  )
}

export default function InitialAssessmentWizard({
  assessment,
  studentId,
  organizationId,
  completedBy = null,
  readOnly = false,
  onSaved,
}) {
  const [answers, setAnswers] = useState(assessment?.answers || {})
  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const step = ASSESSMENT_STEPS[stepIndex]
  const isLastStep = stepIndex === ASSESSMENT_STEPS.length - 1

  const updateAnswer = (key, value) => {
    setAnswers((current) => ({ ...current, [key]: value }))
  }

  const toggleItem = (key, value) => {
    setAnswers((current) => ({ ...current, [key]: value }))
  }

  const persist = async (markCompleted = false) => {
    setSaving(true)
    setError(null)
    const { assessment: saved, error: saveError } = await saveInitialAssessmentStep({
      assessmentId: assessment?.id,
      studentId,
      organizationId,
      answers,
      completedBy,
      markCompleted,
      status: markCompleted ? 'completed' : 'in_progress',
    })
    setSaving(false)
    if (saveError) {
      setError(saveError)
      return false
    }
    onSaved?.(saved)
    return true
  }

  const handleNext = async () => {
    const ok = await persist(isLastStep)
    if (!ok) return
    if (!isLastStep) setStepIndex((current) => current + 1)
  }

  return (
    <div className="space-y-5">
      <StepProgress currentIndex={stepIndex} steps={ASSESSMENT_STEPS} />

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-700">
          Étape {stepIndex + 1} / {ASSESSMENT_STEPS.length}
        </p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">{step.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{step.description}</p>

        <div className="mt-5">
          {step.fields && (
            <GeneralFields
              answers={answers}
              fields={step.fields}
              onChange={updateAnswer}
              readOnly={readOnly}
            />
          )}
          {step.items && (
            <ScoredItems
              answers={answers}
              items={step.items}
              onToggle={toggleItem}
              readOnly={readOnly}
            />
          )}
          {step.readOnly && <ResultsPanel answers={answers} />}
        </div>
      </section>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <button
            className="pd-btn-secondary"
            disabled={stepIndex === 0 || saving}
            onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
            type="button"
          >
            Étape précédente
          </button>
          <button
            className="pd-btn-primary"
            disabled={saving}
            onClick={handleNext}
            type="button"
          >
            {saving ? 'Enregistrement…' : isLastStep ? 'Finaliser l\'évaluation' : 'Enregistrer et continuer'}
          </button>
        </div>
      )}
    </div>
  )
}
