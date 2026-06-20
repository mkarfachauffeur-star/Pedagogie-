import { useCallback, useEffect, useRef, useState } from 'react'
import CharterContentView from './CharterContentView'
import { acceptStudentCharter } from '../../services/studentCharter'
import { getUserFacingError } from '../../lib/userFacingError'

export default function StudentCharterAcceptanceScreen({ charter, onAccepted }) {
  const [acceptedChecked, setAcceptedChecked] = useState(false)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  const checkScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const threshold = 48
    const reachedBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
    const shortContent = container.scrollHeight <= container.clientHeight + threshold
    if (reachedBottom || shortContent) setScrolledToEnd(true)
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(checkScroll, 120)
    return () => window.clearTimeout(timerId)
  }, [checkScroll, charter?.content])

  const submit = async (event) => {
    event.preventDefault()
    if (!acceptedChecked || !scrolledToEnd || !charter?.id) return
    setSaving(true)
    setError(null)
    const { error: saveError } = await acceptStudentCharter(charter.id)
    setSaving(false)
    if (saveError) {
      setError(getUserFacingError(saveError, 'save'))
      return
    }
    onAccepted?.()
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#f0f7ff]">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
          Première connexion
        </p>
        <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
          {charter?.title || 'Charte d\'engagement de l\'élève'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Lisez la charte en entier, puis cochez votre acceptation pour accéder à Pedagogia Drive.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
        onScroll={checkScroll}
      >
        <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <CharterContentView content={charter?.content} />
        </div>
      </div>

      <form
        className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6"
        onSubmit={submit}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {!scrolledToEnd && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Faites défiler la charte jusqu&apos;en bas pour activer la case d&apos;acceptation.
            </p>
          )}

          <label className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${scrolledToEnd ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-slate-50 opacity-70'}`}>
            <input
              checked={acceptedChecked}
              className="mt-1"
              disabled={!scrolledToEnd || saving}
              onChange={(event) => setAcceptedChecked(event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm font-semibold text-slate-800">
              J&apos;ai lu et j&apos;accepte la Charte d&apos;engagement de l&apos;élève.
            </span>
          </label>

          <p className="text-xs font-semibold text-slate-500">
            La validation de cette charte est obligatoire pour accéder à Pedagogia Drive.
          </p>

          {error && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
              {error}
            </p>
          )}

          <button
            className="pd-btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!acceptedChecked || !scrolledToEnd || saving}
            type="submit"
          >
            {saving ? 'Validation…' : 'Accéder à Pedagogia Drive'}
          </button>
        </div>
      </form>
    </div>
  )
}
