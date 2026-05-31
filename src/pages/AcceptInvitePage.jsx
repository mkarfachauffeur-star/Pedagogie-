import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BrandLogo from '../components/BrandLogo'

const inputClass =
  'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100'

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) setReady(true)
    })
    return () => listener?.subscription?.unsubscribe?.()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (password.length < 8) {
      setError('Mot de passe : 8 caractères minimum.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setBusy(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    navigate('/login', { state: { message: 'Mot de passe défini. Connectez-vous.' } })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-950 to-cyan-950 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
        <BrandLogo />
        <h1 className="mt-6 text-2xl font-extrabold text-slate-950">Activer votre compte</h1>
        <p className="mt-2 text-sm text-slate-500">Définissez votre mot de passe pour accéder à PEDAGOGIA DRIVE.</p>
        {!ready && (
          <p className="mt-4 text-sm text-amber-700">Ouvrez le lien reçu par e-mail pour activer cette page.</p>
        )}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Nouveau mot de passe</span>
            <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Confirmation</span>
            <input className={inputClass} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
          <button type="submit" disabled={busy || !ready} className="pd-btn-primary w-full disabled:opacity-60">
            {busy ? 'Enregistrement…' : 'Activer mon compte'}
          </button>
        </form>
        <Link to="/login" className="mt-4 block text-center text-sm font-bold text-cyan-700">Déjà un compte ? Se connecter</Link>
      </div>
    </div>
  )
}
