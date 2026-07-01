import { useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import { fetchPlatformSettings, savePlatformSettings } from '../../services/platform'

export default function PlatformSettingsPage() {
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    fetchPlatformSettings().then(({ settings }) => {
      setAlertsEnabled(settings.notifications?.prospect_alerts !== false)
    })
  }, [])

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    const { error } = await savePlatformSettings('notifications', { prospect_alerts: alertsEnabled })
    setSaving(false)
    if (error) {
      setFeedback({ type: 'error', message: error.message || 'Enregistrement impossible.' })
      return
    }
    setFeedback({ type: 'ok', message: 'Paramètres enregistrés.' })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHero
        eyebrow="Super Admin"
        title="Paramètres plateforme"
        subtitle="Configuration du back-office SaaS."
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

      <form className="space-y-4 rounded-2xl border-2 border-slate-300 bg-white p-6" onSubmit={handleSave}>
        <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
          <input
            checked={alertsEnabled}
            className="h-4 w-4"
            onChange={(e) => setAlertsEnabled(e.target.checked)}
            type="checkbox"
          />
          Afficher les alertes « nouvelles demandes » dans le Super Admin
        </label>

        <p className="text-xs text-slate-500">
          Les e-mails automatiques au dépôt du formulaire public nécessitent{' '}
          <code className="rounded bg-slate-100 px-1">RESEND_API_KEY</code> dans Supabase Edge Functions.
        </p>

        <button
          className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-black text-white disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          Enregistrer
        </button>
      </form>
    </div>
  )
}
