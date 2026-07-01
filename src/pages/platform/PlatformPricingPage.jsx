import { useCallback, useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import { formatPlatformEur } from '../../lib/platformPlans'
import { listPlatformPlans, updateSaasPlan } from '../../services/platform'

export default function PlatformPricingPage() {
  const [plans, setPlans] = useState([])
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const refresh = useCallback(async () => {
    const { plans: rows } = await listPlatformPlans()
    setPlans(rows)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFeedback(null)

    const form = new FormData(event.currentTarget)
    const trialDays = Number(form.get('trial_days'))
    const starterEur = Number(form.get('starter_eur'))
    const premiumEur = Number(form.get('premium_eur'))

    const trial = plans.find((p) => p.code === 'trial')
    const starter = plans.find((p) => p.code === 'starter')
    const premium = plans.find((p) => p.code === 'premium')

    const results = await Promise.all([
      trial ? updateSaasPlan(trial.id, { trial_days: trialDays }) : null,
      starter ? updateSaasPlan(starter.id, { price_cents: Math.round(starterEur * 100) }) : null,
      premium ? updateSaasPlan(premium.id, { price_cents: Math.round(premiumEur * 100) }) : null,
    ])

    setSaving(false)
    const failed = results.some((r) => r?.error)
    if (failed) {
      setFeedback({ type: 'error', message: 'Enregistrement partiel ou impossible. Vérifiez vos droits Super Admin.' })
    } else {
      setFeedback({ type: 'ok', message: 'Tarifs SaaS mis à jour en base de données.' })
    }
    refresh()
  }

  const trial = plans.find((p) => p.code === 'trial')
  const starter = plans.find((p) => p.code === 'starter')
  const premium = plans.find((p) => p.code === 'premium')

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHero
        eyebrow="Super Admin — Confidentiel"
        title="Tarifs SaaS"
        subtitle="Ces tarifs ne sont jamais affichés sur le site public. Stockés dans la table plans."
      />

      {feedback && (
        <p
          className={`rounded-xl border-2 px-4 py-3 text-sm font-bold ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.message}
        </p>
      )}

      <form className="rounded-2xl border-2 border-slate-300 bg-white p-6 space-y-5" onSubmit={handleSave}>
        <label className="block text-sm font-bold text-slate-700">
          Durée essai gratuit (jours)
          <input
            className="mt-2 w-full rounded-xl border-2 border-slate-300 px-4 py-3"
            defaultValue={trial?.trial_days ?? 30}
            min={1}
            name="trial_days"
            required
            type="number"
          />
        </label>

        <label className="block text-sm font-bold text-slate-700">
          Starter — € / mois (engagement annuel)
          <input
            className="mt-2 w-full rounded-xl border-2 border-slate-300 px-4 py-3"
            defaultValue={starter ? starter.price_cents / 100 : ''}
            min={0}
            name="starter_eur"
            required
            step="0.01"
            type="number"
          />
          {starter && (
            <p className="mt-1 text-xs text-slate-500">Actuel : {formatPlatformEur(starter.price_cents, { fromCents: true })}/mois</p>
          )}
        </label>

        <label className="block text-sm font-bold text-slate-700">
          Premium — € / mois (engagement annuel)
          <input
            className="mt-2 w-full rounded-xl border-2 border-slate-300 px-4 py-3"
            defaultValue={premium ? premium.price_cents / 100 : ''}
            min={0}
            name="premium_eur"
            required
            step="0.01"
            type="number"
          />
          {premium && (
            <p className="mt-1 text-xs text-slate-500">Actuel : {formatPlatformEur(premium.price_cents, { fromCents: true })}/mois</p>
          )}
        </label>

        <button
          className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-black text-white hover:bg-cyan-700 disabled:opacity-60"
          disabled={saving || !plans.length}
          type="submit"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les tarifs'}
        </button>
      </form>
    </div>
  )
}
