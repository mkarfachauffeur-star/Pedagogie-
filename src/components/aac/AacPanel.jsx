import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  completeAacTrip,
  getAacBundle,
  markAacCompleted,
  startAacTrip,
  updateAacStartDate,
  uploadAacFfi,
  upsertAacRvp,
  appendAacTripPoints,
} from '../../services/aac'
import { listTeachers } from '../../services/teachers'
import { daysBetween, formatDateFr, statusLabel } from '../../lib/aacRules'
import {
  accumulateDistance,
  getCurrentPosition,
  requestLocationPermission,
  watchPosition,
} from '../../lib/geolocation'
import AacTripMap from './AacTripMap'

function formatDuration(seconds) {
  const s = Math.max(0, Number(seconds) || 0)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`
  return `${m} min ${String(sec).padStart(2, '0')}s`
}

/**
 * Panneau AAC partagé (élève lecture + staff édition).
 * @param {'student'|'staff'} mode
 */
export default function AacPanel({
  studentId,
  organizationId,
  mode = 'student',
  birthDate = null,
  userId = null,
  senderName = null,
}) {
  const isStaff = mode === 'staff'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bundle, setBundle] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [startDateDraft, setStartDateDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [livePoints, setLivePoints] = useState([])
  const [liveKm, setLiveKm] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [tracking, setTracking] = useState(false)
  const [lastTripSummary, setLastTripSummary] = useState(null)
  const watchRef = useRef(null)
  const tickRef = useRef(null)
  const pointBufferRef = useRef([])
  const seqRef = useRef(0)

  const reload = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    setError('')
    const { bundle: next, error: loadError } = await getAacBundle(studentId)
    if (loadError) setError(loadError.message || 'Chargement impossible.')
    setBundle(next)
    setStartDateDraft(next?.profile?.startedAt || '')
    setLoading(false)
  }, [studentId])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!isStaff) return
    void listTeachers().then(({ teachers: rows }) => setTeachers(rows || []))
  }, [isStaff])

  useEffect(() => () => {
    watchRef.current?.stop?.()
    if (tickRef.current) clearInterval(tickRef.current)
  }, [])

  const profile = bundle?.profile
  const rvp = bundle?.rvp || []
  const trips = bundle?.trips || []
  const conditions = profile?.conditions
  const progress = profile?.progress

  const daysElapsed = useMemo(
    () => (profile?.startedAt ? daysBetween(profile.startedAt) : null),
    [profile?.startedAt],
  )
  const daysToEligible = useMemo(() => {
    if (!profile?.examEligibleAt) return null
    return daysBetween(new Date(), profile.examEligibleAt)
  }, [profile?.examEligibleAt])

  async function flushPoints(tripId, orgId) {
    const batch = pointBufferRef.current
    if (!batch.length) return
    pointBufferRef.current = []
    await appendAacTripPoints(tripId, orgId, batch)
  }

  async function handleStartTrip() {
    setError('')
    setSaving(true)
    try {
      const allowed = await requestLocationPermission()
      if (!allowed) throw new Error('Autorisez la localisation pour démarrer un trajet.')
      await getCurrentPosition()
      const { trip, error: startError } = await startAacTrip(studentId)
      if (startError) throw startError

      setTracking(true)
      setLivePoints([])
      setLiveKm(0)
      setElapsed(0)
      setLastTripSummary(null)
      seqRef.current = 0
      pointBufferRef.current = []

      const startedMs = Date.now()
      tickRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedMs) / 1000))
      }, 1000)

      watchRef.current = watchPosition(
        (pos) => {
          const withSeq = { ...pos, sequenceNo: seqRef.current }
          seqRef.current += 1
          setLivePoints((prev) => {
            const next = [...prev, withSeq]
            setLiveKm(accumulateDistance(next))
            return next
          })
          pointBufferRef.current.push(withSeq)
          if (pointBufferRef.current.length >= 8) {
            void flushPoints(trip.id, organizationId || bundle?.student?.organization_id)
          }
        },
        (err) => setError(err.message),
      )

      setBundle((prev) => (prev ? { ...prev, activeTrip: trip } : prev))
    } catch (err) {
      setError(err.message || 'Impossible de démarrer le trajet.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStopTrip() {
    const trip = bundle?.activeTrip
    if (!trip) return
    setSaving(true)
    setError('')
    try {
      watchRef.current?.stop?.()
      watchRef.current = null
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
      setTracking(false)

      const orgId = organizationId || bundle?.student?.organization_id
      await flushPoints(trip.id, orgId)

      const distanceKm = accumulateDistance(livePoints)
      const { trip: completed, error: stopError } = await completeAacTrip(trip.id, studentId, {
        points: livePoints,
        distanceKm,
        startedAt: trip.startedAt,
      })
      if (stopError) throw stopError

      setLastTripSummary(completed)
      await reload()
    } catch (err) {
      setError(err.message || 'Impossible de terminer le trajet.')
    } finally {
      setSaving(false)
    }
  }

  async function saveStartDate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: saveError } = await updateAacStartDate(studentId, startDateDraft || null)
    if (saveError) setError(saveError.message)
    else await reload()
    setSaving(false)
  }

  async function saveRvp(sequence, patch) {
    setSaving(true)
    setError('')
    const current = rvp.find((r) => r.sequence === sequence) || {}
    const { error: saveError } = await upsertAacRvp(studentId, {
      sequence,
      heldOn: patch.heldOn ?? current.heldOn,
      teacherId: patch.teacherId ?? current.teacherId,
      companionName: patch.companionName ?? current.companionName,
      observations: patch.observations ?? current.observations,
      completed: patch.completed ?? current.completed,
    })
    if (saveError) setError(saveError.message)
    else await reload()
    setSaving(false)
  }

  async function handleFfiUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setSaving(true)
    setError('')
    const { error: upError } = await uploadAacFfi({
      organizationId: organizationId || bundle?.student?.organization_id,
      studentId,
      file,
      createdBy: userId,
      senderName,
    })
    if (upError) setError(upError.message)
    else await reload()
    setSaving(false)
  }

  async function handleMarkComplete() {
    if (!window.confirm('Marquer la conduite accompagnée comme terminée ?')) return
    setSaving(true)
    const { error: markError } = await markAacCompleted(studentId)
    if (markError) setError(markError.message)
    else await reload()
    setSaving(false)
  }

  if (loading) {
    return <p className="text-sm font-semibold text-slate-500">Chargement du suivi AAC…</p>
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Aucun profil AAC. {isStaff ? 'Renseignez une date d’entrée pour l’activer.' : 'Contactez le secrétariat.'}
        {isStaff && (
          <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={saveStartDate}>
            <label className="text-sm font-bold">
              Date d’entrée en AAC
              <input
                className="pd-input mt-1 block"
                type="date"
                value={startDateDraft}
                onChange={(e) => setStartDateDraft(e.target.value)}
              />
            </label>
            <button className="rounded-xl bg-navy-950 px-4 py-2 text-sm font-bold text-white" type="submit">
              Créer le profil
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* Dashboard */}
      <section className="overflow-hidden rounded-[1.75rem] border-2 border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-200">Conduite accompagnée</p>
              <h2 className="mt-1 text-2xl font-black">Tableau de bord AAC</h2>
            </div>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold">
              {statusLabel(profile.status)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Kilomètres" value={`${Math.round(progress?.km || 0)}`} hint={`/ ${progress?.target || 3000} km`} />
            <Kpi label="Restants" value={`${Math.round(progress?.remaining || 0)}`} hint="km avant 3000" />
            <Kpi label="Trajets" value={String(profile.tripCount || 0)} hint="enregistrés" />
            <Kpi
              label="RVP"
              value={`${rvp.filter((r) => r.completed).length}/3`}
              hint="effectués"
            />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm font-semibold text-cyan-100">
              <span>Progression kilométrique</span>
              <span>{progress?.percent || 0} %</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                style={{ width: `${progress?.percent || 0}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-cyan-50/90 sm:grid-cols-3">
            <p>Début : <strong>{formatDateFr(profile.startedAt)}</strong></p>
            <p>Jours écoulés : <strong>{daysElapsed ?? '—'}</strong></p>
            <p>
              Jours restants (1 an) :{' '}
              <strong>{daysToEligible == null ? '—' : Math.max(0, daysToEligible)}</strong>
            </p>
          </div>
          <p className="mt-2 text-sm text-cyan-100/80">
            Examen possible à partir du <strong>{formatDateFr(profile.examEligibleAt)}</strong> (1 an révolu).
          </p>
        </div>

        {isStaff && (
          <form className="flex flex-wrap items-end gap-3 border-t border-slate-100 p-4" onSubmit={saveStartDate}>
            <label className="text-sm font-bold text-slate-700">
              Date d’entrée en AAC
              <input
                className="pd-input mt-1 block"
                type="date"
                value={startDateDraft}
                onChange={(e) => setStartDateDraft(e.target.value)}
              />
            </label>
            <button
              className="rounded-xl bg-navy-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              disabled={saving}
              type="submit"
            >
              Enregistrer
            </button>
            {profile.status === 'conditions_remplies' && (
              <button
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800"
                disabled={saving}
                onClick={handleMarkComplete}
                type="button"
              >
                Marquer terminée
              </button>
            )}
          </form>
        )}
      </section>

      {/* Conditions */}
      <section className="rounded-[1.75rem] border-2 border-slate-200 bg-white p-5">
        <h3 className="text-lg font-black text-slate-950">Conditions de fin AAC</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <Cond ok={conditions?.yearOk} label="1 année complète de conduite accompagnée (jour pour jour)" />
          <Cond ok={conditions?.kmOk} label="Minimum 3000 km parcourus" />
          <Cond ok={conditions?.ageOk} label={`Âge minimum 17 ans${conditions?.age != null ? ` (actuel : ${conditions.age} ans)` : ''}`} />
          <Cond ok={conditions?.rvpOk} label="Les 3 rendez-vous pédagogiques effectués" />
        </ul>
        {conditions?.allMet && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
            Conditions remplies — L’élève peut être présenté à l’examen du permis de conduire.
          </div>
        )}
      </section>

      {/* Trajet GPS — élève */}
      {!isStaff && (
        <section className="rounded-[1.75rem] border-2 border-slate-200 bg-white p-5">
          <h3 className="text-lg font-black text-slate-950">Mon trajet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Gardez l’écran allumé pendant le trajet. Le GPS calcule automatiquement les kilomètres.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
              disabled={saving || tracking || Boolean(bundle?.activeTrip)}
              onClick={handleStartTrip}
              type="button"
            >
              ▶ Démarrer mon trajet
            </button>
            <button
              className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
              disabled={saving || (!tracking && !bundle?.activeTrip)}
              onClick={handleStopTrip}
              type="button"
            >
              ■ Terminer mon trajet
            </button>
          </div>
          {(tracking || bundle?.activeTrip) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <KpiLight label="Distance" value={`${liveKm.toFixed(2)} km`} />
              <KpiLight label="Durée" value={formatDuration(elapsed)} />
              <KpiLight label="Points GPS" value={String(livePoints.length)} />
            </div>
          )}
          {lastTripSummary && (
            <div className="mt-4 space-y-3 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
              <p className="text-sm font-bold text-cyan-900">
                Trajet enregistré — {lastTripSummary.distanceKm.toFixed(2)} km · {formatDuration(lastTripSummary.durationSeconds)}
              </p>
              <p className="text-xs text-slate-600">
                Départ {new Date(lastTripSummary.startedAt).toLocaleString('fr-FR')}
                {lastTripSummary.endedAt
                  ? ` → Arrivée ${new Date(lastTripSummary.endedAt).toLocaleString('fr-FR')}`
                  : ''}
              </p>
              <AacTripMap path={lastTripSummary.pathSummary} />
            </div>
          )}
        </section>
      )}

      {/* Historique trajets */}
      <section className="rounded-[1.75rem] border-2 border-slate-200 bg-white p-5">
        <h3 className="text-lg font-black text-slate-950">Trajets enregistrés</h3>
        {!trips.filter((t) => t.status === 'completed').length ? (
          <p className="mt-2 text-sm text-slate-500">Aucun trajet pour le moment.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {trips
              .filter((t) => t.status === 'completed')
              .slice(0, isStaff ? 20 : 10)
              .map((trip) => (
                <li key={trip.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-bold text-slate-900">
                      {trip.distanceKm.toFixed(2)} km · {formatDuration(trip.durationSeconds)}
                    </span>
                    <span className="text-slate-500">
                      {new Date(trip.startedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <AacTripMap className="mt-2" path={trip.pathSummary} />
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* RVP */}
      <section className="rounded-[1.75rem] border-2 border-slate-200 bg-white p-5">
        <h3 className="text-lg font-black text-slate-950">Rendez-vous pédagogiques (RVP)</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((seq) => {
            const item = rvp.find((r) => r.sequence === seq) || {
              sequence: seq,
              completed: false,
              heldOn: '',
              companionName: '',
              observations: '',
              teacherId: '',
            }
            return (
              <div
                key={seq}
                className={`rounded-2xl border p-4 ${
                  item.completed
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p className="font-black text-slate-950">
                  {item.completed ? '✓ ' : ''}RVP {seq}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {item.completed ? 'Effectué' : 'À faire'}
                </p>
                {isStaff ? (
                  <div className="mt-3 space-y-2">
                    <input
                      className="pd-input w-full text-sm"
                      type="date"
                      value={item.heldOn || ''}
                      onChange={(e) => saveRvp(seq, { heldOn: e.target.value })}
                    />
                    <select
                      className="pd-input w-full text-sm"
                      value={item.teacherId || ''}
                      onChange={(e) => saveRvp(seq, { teacherId: e.target.value || null })}
                    >
                      <option value="">Enseignant…</option>
                      {teachers.map((t) => (
                        <option key={t.profile_id || t.id} value={t.profile_id || t.id}>
                          {t.first_name} {t.last_name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="pd-input w-full text-sm"
                      placeholder="Accompagnateur"
                      defaultValue={item.companionName}
                      onBlur={(e) => {
                        if (e.target.value !== (item.companionName || '')) {
                          void saveRvp(seq, { companionName: e.target.value })
                        }
                      }}
                    />
                    <textarea
                      className="pd-input w-full text-sm"
                      placeholder="Observations"
                      rows={2}
                      defaultValue={item.observations}
                      onBlur={(e) => {
                        if (e.target.value !== (item.observations || '')) {
                          void saveRvp(seq, { observations: e.target.value })
                        }
                      }}
                    />
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        checked={Boolean(item.completed)}
                        onChange={(e) => saveRvp(seq, { completed: e.target.checked })}
                        type="checkbox"
                      />
                      Effectué
                    </label>
                  </div>
                ) : (
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>Date : {formatDateFr(item.heldOn)}</p>
                    <p>Accompagnateur : {item.companionName || '—'}</p>
                    {item.observations && <p className="text-slate-500">{item.observations}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* FFI */}
      <section className="rounded-[1.75rem] border-2 border-slate-200 bg-white p-5">
        <h3 className="text-lg font-black text-slate-950">Attestation FFI</h3>
        <p className="mt-1 text-sm text-slate-500">
          Attestation de Fin de Formation Initiale — nécessaire pour l’assurance avant de démarrer la conduite accompagnée.
        </p>
        {bundle?.ffi?.url ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              className="rounded-xl bg-navy-950 px-4 py-2 text-sm font-bold text-white"
              href={bundle.ffi.url}
              rel="noreferrer"
              target="_blank"
            >
              Aperçu / télécharger
            </a>
            <span className="self-center text-sm text-slate-500">{bundle.ffi.file_name}</span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-700">Aucun document FFI déposé.</p>
        )}
        <label className="mt-4 inline-flex cursor-pointer rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-cyan-50">
          {bundle?.ffi ? 'Remplacer le PDF' : 'Déposer le PDF'}
          <input accept="application/pdf,.pdf" className="hidden" onChange={handleFfiUpload} type="file" />
        </label>
      </section>
    </div>
  )
}

function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-cyan-50/80">{label}</p>
      {hint && <p className="text-[11px] text-cyan-100/60">{hint}</p>}
    </div>
  )
}

function KpiLight({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-lg font-extrabold text-slate-950">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  )
}

function Cond({ ok, label }) {
  return (
    <li className={`flex items-start gap-2 ${ok ? 'text-emerald-800' : 'text-slate-600'}`}>
      <span className="mt-0.5 font-black">{ok ? '✓' : '○'}</span>
      <span>{label}</span>
    </li>
  )
}
