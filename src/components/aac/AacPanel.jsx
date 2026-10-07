import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { App } from '@capacitor/app'
import {
  addAacPedagogicalAppointment,
  appendAacTripPoints,
  cancelAacTrip,
  completeAacTrip,
  getAacBundle,
  getAacTripPoints,
  getActiveAacTrip,
  markAacCompleted,
  saveAacTripDetails,
  startAacTrip,
  updateAacStartDate,
  uploadAacFfi,
  upsertAacRvp,
} from '../../services/aac'
import { listTeachers } from '../../services/teachers'
import {
  AAC_DRIVING_CONDITIONS,
  AAC_MAX_RVP_COUNT,
  AAC_REQUIRED_RVP_COUNT,
  countMandatoryRvpCompleted,
  daysBetween,
  drivingConditionLabel,
  formatDateFr,
  mandatoryRvpTitle,
  rvpRequirementLabel,
  statusLabel,
} from '../../lib/aacRules'
import {
  acquireAccuratePosition,
  canOpenLocationSettings,
  classifyLocationError,
  formatKm,
  flushNativeTripPoints,
  inspectLocationAccess,
  LOCATION_STATUS_MESSAGES,
  measureTrack,
  openLocationSettings,
  requestLocationAccess,
  watchPosition,
} from '../../lib/geolocation'
import AacTripMap from './AacTripMap'

function formatDurationMinutes(seconds) {
  const total = Math.max(0, Math.round((Number(seconds) || 0) / 60))
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, '0')} min`
  return `${minutes} min`
}

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
  const [stopBusy, setStopBusy] = useState(false)
  const [lastTripSummary, setLastTripSummary] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('prompt')
  const [locationScope, setLocationScope] = useState('')
  const [lastAccuracy, setLastAccuracy] = useState(null)
  const [mandatoryRvp, setMandatoryRvp] = useState([])
  const [extraRvp, setExtraRvp] = useState([])
  const [extraDraft, setExtraDraft] = useState('')
  const [extraOpen, setExtraOpen] = useState(false)
  const [drivingConditions, setDrivingConditions] = useState([])
  const watchRef = useRef(null)
  const tickRef = useRef(null)
  const flushLoopRef = useRef(null)
  const wakeLockRef = useRef(null)
  const pointBufferRef = useRef([])
  const pointsRef = useRef([])
  const activeTripRef = useRef(null)
  const startTokenRef = useRef(0)
  const stopLockRef = useRef(false)
  const seqRef = useRef(0)
  const sessionTripRef = useRef(null)
  const resumeTrackingRef = useRef(async () => {})
  const flushPointsRef = useRef(async () => {})
  const aliveRef = useRef(true)
  const hasBundleRef = useRef(false)
  const organizationIdRef = useRef(organizationId)
  const detailsRef = useRef({ mandatoryRvp: [], extraRvp: [], drivingConditions: [] })
  organizationIdRef.current = organizationId
  detailsRef.current = { mandatoryRvp, extraRvp, drivingConditions }

  const reload = useCallback(async () => {
    if (!studentId) return
    if (!hasBundleRef.current) setLoading(true)
    setError('')
    const { bundle: next, error: loadError } = await getAacBundle(studentId)
    if (loadError) setError(loadError.message || 'Chargement impossible.')
    setBundle(next)
    hasBundleRef.current = Boolean(next)
    setStartDateDraft(next?.profile?.startedAt || '')
    setLoading(false)
    const active = next?.activeTrip
    if (!isStaff && active?.id && sessionTripRef.current !== active.id && !watchRef.current) {
      sessionTripRef.current = active.id
      await resumeTrackingRef.current(active)
    }
  }, [studentId, isStaff])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!isStaff) return
    void listTeachers().then(({ teachers: rows }) => setTeachers(rows || []))
  }, [isStaff])

  useEffect(() => {
    if (bundle?.activeTrip) activeTripRef.current = bundle.activeTrip
  }, [bundle?.activeTrip])

  useEffect(() => {
    if (isStaff) return undefined
    let cancelled = false
    void inspectLocationAccess().then((access) => {
      if (cancelled || activeTripRef.current) return
      setGpsStatus(access.status === 'granted' ? 'ready' : access.status)
    })
    return () => {
      cancelled = true
    }
  }, [isStaff])

  useEffect(() => () => {
    aliveRef.current = false
    const watch = watchRef.current
    if (watch?.detach) watch.detach()
    else watch?.stop?.()
    if (tickRef.current) clearInterval(tickRef.current)
    if (flushLoopRef.current) clearInterval(flushLoopRef.current)
    void wakeLockRef.current?.release?.()
  }, [])

  useEffect(() => {
    let removed = false
    let handle = null
    void App.addListener('appStateChange', ({ isActive }) => {
      const trip = activeTripRef.current
      if (!trip?.id) return
      if (isActive) {
        void holdScreenAwake()
        if (!watchRef.current && activeTripRef.current) {
          void resumeTrackingRef.current(activeTripRef.current)
          return
        }
        void flushNativeTripPoints()
        setGpsStatus('tracking')
        return
      }
      void flushPointsRef.current(trip.id, organizationIdRef.current || trip.organizationId)
      setGpsStatus('background')
    }).then((listener) => {
      if (removed) void listener.remove()
      else handle = listener
    }).catch(() => {})

    function onVisibility() {
      const trip = activeTripRef.current
      if (!trip?.id) return
      if (document.visibilityState === 'hidden') {
        void flushPointsRef.current(trip.id, organizationIdRef.current || trip.organizationId)
        setGpsStatus('background')
        return
      }
      void holdScreenAwake()
      void flushNativeTripPoints()
      setGpsStatus('tracking')
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      removed = true
      document.removeEventListener('visibilitychange', onVisibility)
      void handle?.remove()
    }
  }, [])

  function stopLocalTracking() {
    watchRef.current?.stop?.()
    watchRef.current = null
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  async function holdScreenAwake() {
    try {
      wakeLockRef.current = await navigator.wakeLock?.request?.('screen')
    } catch {
      wakeLockRef.current = null
    }
  }

  const profile = bundle?.profile
  const rvp = bundle?.rvp || []
  const visibleRvp = [
    ...Array.from({ length: AAC_REQUIRED_RVP_COUNT }, (_, index) => {
      const sequence = index + 1
      return rvp.find((row) => Number(row.sequence) === sequence) || emptyRvp(sequence)
    }),
    ...rvp.filter(isShownExtra).sort((a, b) => Number(a.sequence) - Number(b.sequence)),
  ]
  const highestRvpSequence = rvp.reduce(
    (max, row) => Math.max(max, Number(row.sequence) || 0),
    AAC_REQUIRED_RVP_COUNT,
  )
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
    const id = tripId || activeTripRef.current?.id
    const org = orgId || organizationIdRef.current || activeTripRef.current?.organizationId || bundle?.student?.organization_id
    if (!batch.length || !id || !org) return
    pointBufferRef.current = []
    const { error: flushError } = await appendAacTripPoints(id, org, batch)
    if (flushError) pointBufferRef.current = [...batch, ...pointBufferRef.current]
  }
  flushPointsRef.current = flushPoints

  function startClock(startedAt) {
    const startedMs = new Date(startedAt || Date.now()).getTime()
    if (tickRef.current) clearInterval(tickRef.current)
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedMs) / 1000)))
    tick()
    tickRef.current = setInterval(tick, 1000)
  }

  function startFlushLoop(tripId, orgId) {
    if (flushLoopRef.current) clearInterval(flushLoopRef.current)
    flushLoopRef.current = setInterval(() => {
      void flushPoints(tripId, orgId)
    }, 12000)
  }

  function applyTripDetails(trip) {
    const local = detailsRef.current
    const hasLocal = local.mandatoryRvp.length || local.extraRvp.length || local.drivingConditions.length
    if (hasLocal) return
    setMandatoryRvp(trip?.mandatoryRvp || [])
    setExtraRvp(trip?.extraRvp || [])
    setDrivingConditions(trip?.drivingConditions || [])
  }

  function armTracking(trip, seededPoints) {
    if (!aliveRef.current) return
    const orgId = organizationIdRef.current || bundle?.student?.organization_id || trip.organizationId
    activeTripRef.current = trip
    sessionTripRef.current = trip.id
    pointsRef.current = seededPoints
    if (!pointBufferRef.current.length) pointBufferRef.current = []
    seqRef.current = seededPoints.reduce((max, point) => Math.max(max, Number(point.sequenceNo) || 0), -1) + 1
    setTracking(true)
    setLivePoints(seededPoints)
    setLiveKm(measureTrack(seededPoints).distanceKm)
    setLastAccuracy(seededPoints.at(-1)?.accuracy ?? null)
    setGpsStatus('tracking')
    setLastTripSummary(null)
    startClock(trip.startedAt)
    startFlushLoop(trip.id, orgId)
    void holdScreenAwake()
    watchRef.current?.detach?.()
    watchRef.current = watchPosition(
      (pos) => {
        if (!aliveRef.current) return
        const nativeSequence = Number(pos.sequenceNo)
        const sequenceNo = Number.isFinite(nativeSequence) ? nativeSequence : seqRef.current
        if (pointsRef.current.some((point) => point.sequenceNo === sequenceNo)) return
        if (Number.isFinite(nativeSequence)) seqRef.current = Math.max(seqRef.current, nativeSequence + 1)
        else seqRef.current += 1
        const withSeq = { ...pos, sequenceNo }
        const nextPoints = [...pointsRef.current, withSeq]
        pointsRef.current = nextPoints
        pointBufferRef.current.push(withSeq)
        setLivePoints(nextPoints)
        setLiveKm(measureTrack(nextPoints).distanceKm)
        setLastAccuracy(pos.accuracy)
        if (document.visibilityState === 'visible') setGpsStatus('tracking')
        if (pointBufferRef.current.length >= 4) void flushPoints(trip.id, orgId)
      },
      (err) => {
        const status = classifyLocationError(err)
        if (/arrière-plan|ios:prepare|Info\.plist/i.test(err?.message || '')) {
          setError(err.message)
          return
        }
        if (status === 'denied' || status === 'servicesDisabled' || status === 'restricted') {
          setGpsStatus(status)
          return
        }
        setGpsStatus('paused')
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0, background: true, reset: Boolean(trip.resetNative) },
    )
    setBundle((prev) => (prev ? { ...prev, activeTrip: trip } : prev))
  }

  async function resumeTracking(trip) {
    if (!aliveRef.current) return
    applyTripDetails(trip)
    activeTripRef.current = trip
    setTracking(true)
    startClock(trip.startedAt)
    const access = await requestLocationAccess()
    if (!aliveRef.current) return
    setLocationScope(access.scope || '')
    if (!access.granted) {
      setGpsStatus(access.status)
      return
    }
    const loaded = await getAacTripPoints(trip.id)
    if (!aliveRef.current) return
    let seeded = mergeGpsPoints(loaded.points || [], pointsRef.current, pointBufferRef.current)
    if (!seeded.length) {
      try {
        const fix = await acquireAccuratePosition()
        if (!aliveRef.current) return
        if (fix.weak) {
          setGpsStatus('weak')
          return
        }
        seeded = [{ ...fix.position, sequenceNo: 0 }]
        pointBufferRef.current = seeded
        await flushPoints(trip.id, organizationIdRef.current || trip.organizationId)
        if (!aliveRef.current) return
      } catch (err) {
        if (!aliveRef.current) return
        const status = err.locationStatus || classifyLocationError(err)
        setGpsStatus(status)
        setError(err.message || LOCATION_STATUS_MESSAGES[status] || LOCATION_STATUS_MESSAGES.timeout)
        return
      }
    }
    armTracking(trip, seeded)
  }

  resumeTrackingRef.current = resumeTracking

  async function handleStartTrip() {
    const token = startTokenRef.current + 1
    startTokenRef.current = token
    console.log('[AAC-GPS] handleStartTrip entrée')
    setError('')
    setSaving(true)
    console.log('[AAC-GPS] saving =', true)
    setGpsStatus('acquiring')
    try {
      const access = await requestLocationAccess()
      console.log('[AAC-GPS] requestLocationAccess résultat', access)
      if (startTokenRef.current !== token) return
      setLocationScope(access.scope || '')
      if (!access.granted) {
        setGpsStatus(access.status)
        setError(LOCATION_STATUS_MESSAGES[access.status] || LOCATION_STATUS_MESSAGES.prompt)
        return
      }

      const fix = await acquireAccuratePosition()
      if (startTokenRef.current !== token) return
      if (fix.weak) {
        setGpsStatus('weak')
        setError(LOCATION_STATUS_MESSAGES.weak)
        return
      }

      const { trip, error: startError } = await startAacTrip(studentId)
      if (startError) throw startError
      if (startTokenRef.current !== token) {
        if (trip?.id) await cancelAacTrip(trip.id)
        return
      }

      const details = detailsRef.current
      await saveAacTripDetails(trip.id, details)
      const seeded = [{ ...fix.position, sequenceNo: 0 }]
      pointBufferRef.current = seeded
      const orgId = organizationId || bundle?.student?.organization_id || trip.organizationId
      await flushPoints(trip.id, orgId)
      if (startTokenRef.current !== token) {
        await cancelAacTrip(trip.id)
        return
      }
      console.log('[AAC-GPS] armTracking appelé', { tripId: trip.id })
      armTracking({ ...trip, ...details, resetNative: true }, seeded)
    } catch (err) {
      if (startTokenRef.current === token) {
        const status = err.locationStatus || classifyLocationError(err)
        if (LOCATION_STATUS_MESSAGES[status]) {
          setGpsStatus(status)
          setError(err.message || LOCATION_STATUS_MESSAGES[status])
        } else {
          setGpsStatus('ready')
          setError(err.message || 'Impossible de démarrer le trajet.')
        }
      }
    } finally {
      if (startTokenRef.current === token) {
        setSaving(false)
        console.log('[AAC-GPS] saving =', false)
      }
    }
  }

  async function handleStopTrip() {
    if (stopLockRef.current) return
    stopLockRef.current = true
    startTokenRef.current += 1
    setStopBusy(true)
    setError('')
    stopLocalTracking()
    if (flushLoopRef.current) {
      clearInterval(flushLoopRef.current)
      flushLoopRef.current = null
    }
    void wakeLockRef.current?.release?.()
    wakeLockRef.current = null
    try {
      let trip = activeTripRef.current || bundle?.activeTrip
      if (!trip?.id && studentId) {
        const found = await getActiveAacTrip(studentId)
        if (found.error) throw found.error
        trip = found.trip
      }

      if (!trip?.id) {
        setTracking(false)
        activeTripRef.current = null
        sessionTripRef.current = null
        setGpsStatus('ready')
        setBundle((prev) => (prev ? { ...prev, activeTrip: null } : prev))
        return
      }

      const orgId = organizationId || bundle?.student?.organization_id || trip.organizationId
      await flushPoints(trip.id, orgId)

      const measured = measureTrack(pointsRef.current)
      const details = detailsRef.current
      const { trip: completed, error: stopError } = await completeAacTrip(trip.id, studentId, {
        points: measured.points,
        distanceKm: measured.distanceKm,
        startedAt: trip.startedAt,
        mandatoryRvp: details.mandatoryRvp,
        extraRvp: details.extraRvp,
        drivingConditions: details.drivingConditions,
      })
      if (stopError) throw stopError

      activeTripRef.current = null
      sessionTripRef.current = null
      pointsRef.current = []
      setTracking(false)
      setLivePoints([])
      setLastAccuracy(null)
      setGpsStatus('ready')
      setLastTripSummary({
        ...completed,
        mandatoryRvp: details.mandatoryRvp,
        extraRvp: details.extraRvp,
        drivingConditions: details.drivingConditions,
      })
      setMandatoryRvp([])
      setExtraRvp([])
      setDrivingConditions([])
      setExtraDraft('')
      setExtraOpen(false)
      setBundle((prev) => (prev ? { ...prev, activeTrip: null } : prev))
      await reload()
    } catch (err) {
      setError(err.message || 'Impossible de terminer le trajet.')
    } finally {
      stopLockRef.current = false
      setStopBusy(false)
    }
  }

  function toggleMandatory(sequence) {
    setMandatoryRvp((current) => {
      const next = current.includes(sequence)
        ? current.filter((item) => item !== sequence)
        : [...current, sequence].sort()
      const details = { ...detailsRef.current, mandatoryRvp: next }
      detailsRef.current = details
      if (activeTripRef.current?.id) void saveAacTripDetails(activeTripRef.current.id, details)
      return next
    })
  }

  function toggleCondition(id) {
    setDrivingConditions((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      const details = { ...detailsRef.current, drivingConditions: next }
      detailsRef.current = details
      if (activeTripRef.current?.id) void saveAacTripDetails(activeTripRef.current.id, details)
      return next
    })
  }

  function addExtraRvp(event) {
    event.preventDefault()
    const label = extraDraft.trim()
    if (!label) return
    const next = [...extraRvp, { id: globalThis.crypto?.randomUUID?.() || `rvp-${Date.now()}`, label: label.slice(0, 120) }]
    setExtraRvp(next)
    setExtraDraft('')
    const details = { ...detailsRef.current, extraRvp: next }
    detailsRef.current = details
    if (activeTripRef.current?.id) void saveAacTripDetails(activeTripRef.current.id, details)
  }

  function removeExtraRvp(id) {
    const next = extraRvp.filter((item) => item.id !== id)
    setExtraRvp(next)
    const details = { ...detailsRef.current, extraRvp: next }
    detailsRef.current = details
    if (activeTripRef.current?.id) void saveAacTripDetails(activeTripRef.current.id, details)
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
      preserveExtraMarker: Boolean(current.preserveExtraMarker),
      markAsAdditional: Boolean(patch.markAsAdditional),
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

  async function handleAddRvp() {
    setSaving(true)
    setError('')
    const { error: addError } = await addAacPedagogicalAppointment(studentId)
    if (addError) setError(addError.message)
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

  const tripActive = tracking || Boolean(bundle?.activeTrip)
  const stopBar = tripActive && !isStaff && typeof document !== 'undefined'
    ? createPortal(
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-rose-200 bg-white/95 px-4 pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="mb-2 text-center text-xs font-bold text-slate-500">
          Trajet en cours · {formatKm(liveKm)} km · {formatDuration(elapsed)}
        </p>
        <button
          className="w-full touch-manipulation rounded-xl bg-rose-600 px-5 py-4 text-base font-extrabold text-white disabled:opacity-50"
          disabled={stopBusy}
          onClick={handleStopTrip}
          type="button"
        >
          {stopBusy ? 'Arrêt du trajet…' : '⏹️ ARRÊTER LE TRAJET'}
        </button>
      </div>,
      document.body,
    )
    : null

  if (loading) {
    return (
      <>
        {stopBar}
        <p className="text-sm font-semibold text-slate-500">Chargement du suivi AAC…</p>
      </>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {stopBar}
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
    <div className={`flex flex-col gap-5 ${tripActive && !isStaff ? 'pb-28' : ''}`}>
      {stopBar}
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
              value={`${countMandatoryRvpCompleted(rvp)}/${AAC_REQUIRED_RVP_COUNT}`}
              hint="obligatoires"
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
          <Cond ok={conditions?.rvpOk} label="Les 2 rendez-vous pédagogiques obligatoires effectués" />
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-black text-slate-950">Mon trajet</h3>
            {tripActive && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800">
                Trajet en cours
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {LOCATION_STATUS_MESSAGES.prompt}
            {' '}Pendant le trajet, la position continue d’être reçue si l’iPhone est verrouillé ou si vous ouvrez une autre application. Le suivi s’arrête uniquement quand vous appuyez sur Arrêter le trajet. Un indicateur de localisation iOS reste visible tant que le trajet est en cours.
          </p>
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${gpsStatusClass(gpsStatus)}`}>
            <p>{LOCATION_STATUS_MESSAGES[gpsStatus] || LOCATION_STATUS_MESSAGES.prompt}</p>
            {tripActive && locationScope === 'whenInUse' && (
              <p className="mt-2 text-xs font-bold">
                Pour que les kilomètres continuent à coup sûr écran verrouillé, choisissez Toujours dans Réglages &gt; Pedagogia Drive &gt; Localisation.
              </p>
            )}
            {lastAccuracy != null && tripActive && (
              <p className="mt-1 text-xs font-bold opacity-80">
                Précision GPS : ± {Math.round(lastAccuracy)} m · {livePoints.length} position{livePoints.length > 1 ? 's' : ''} reçue{livePoints.length > 1 ? 's' : ''}
              </p>
            )}
            {canOpenLocationSettings() && ['denied', 'restricted', 'servicesDisabled'].includes(gpsStatus) && (
              <button
                className="mt-3 rounded-xl bg-navy-950 px-4 py-2 text-sm font-extrabold text-white"
                onClick={openLocationSettings}
                type="button"
              >
                Ouvrir les réglages
              </button>
            )}
          </div>

          <div className="mt-5">
            <h4 className="text-sm font-black uppercase tracking-wide text-slate-950">RVP obligatoires</h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Cochez un rendez-vous seulement s’il a eu lieu pendant ce trajet. Cela n’efface pas le suivi officiel du dossier.
            </p>
            <div className="mt-3 space-y-2">
              {[1, 2].map((sequence) => (
                <label
                  key={sequence}
                  className="flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-800"
                >
                  <input
                    checked={mandatoryRvp.includes(sequence)}
                    className="mt-0.5 h-5 w-5 shrink-0"
                    onChange={() => toggleMandatory(sequence)}
                    type="checkbox"
                  />
                  <span>{mandatoryRvpTitle(sequence)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-sm font-black uppercase tracking-wide text-slate-950">RVP facultatifs</h4>
            <ul className="mt-2 space-y-2">
              {extraRvp.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <button className="text-xs font-bold text-rose-700" onClick={() => removeExtraRvp(item.id)} type="button">
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
            {extraOpen ? (
              <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={addExtraRvp}>
                <input
                  className="pd-input min-w-0 flex-1"
                  maxLength={120}
                  onChange={(event) => setExtraDraft(event.target.value)}
                  placeholder="Intitulé du rendez-vous"
                  value={extraDraft}
                />
                <button className="rounded-xl bg-navy-950 px-4 py-2 text-sm font-extrabold text-white" type="submit">
                  Ajouter
                </button>
              </form>
            ) : (
              <button
                className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-900"
                onClick={() => setExtraOpen(true)}
                type="button"
              >
                + AJOUTER UN RVP
              </button>
            )}
          </div>

          <div className="mt-5">
            <h4 className="text-sm font-black uppercase tracking-wide text-slate-950">Conditions de conduite</h4>
            <p className="mt-1 text-xs text-slate-500">Facultatif. Plusieurs cases peuvent être cochées.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {AAC_DRIVING_CONDITIONS.map((item) => (
                <label
                  key={item.id}
                  className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  <input
                    checked={drivingConditions.includes(item.id)}
                    className="h-5 w-5 shrink-0"
                    onChange={() => toggleCondition(item.id)}
                    type="checkbox"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <button
              className="w-full touch-manipulation rounded-xl bg-emerald-600 px-5 py-4 text-base font-extrabold text-white disabled:opacity-50"
              disabled={saving || tripActive}
              onClick={handleStartTrip}
              type="button"
            >
              {saving ? 'Acquisition GPS…' : '▶️ DÉMARRER LE TRAJET'}
            </button>
            <button
              className="w-full touch-manipulation rounded-xl bg-rose-600 px-5 py-4 text-base font-extrabold text-white disabled:opacity-50"
              disabled={stopBusy || !tripActive}
              onClick={handleStopTrip}
              type="button"
            >
              {stopBusy ? 'Arrêt du trajet…' : '⏹️ ARRÊTER LE TRAJET'}
            </button>
          </div>
          {tripActive && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <KpiLight label="Distance" value={`${formatKm(liveKm)} km`} />
              <KpiLight label="Durée" value={formatDuration(elapsed)} />
              <KpiLight label="Positions GPS" value={String(livePoints.length)} />
            </div>
          )}
          {lastTripSummary && (
            <div className="mt-4">
              <TripRecap trip={lastTripSummary} />
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
                <li key={trip.id}>
                  <TripRecap trip={trip} />
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* RVP */}
      <section className="rounded-[1.75rem] border-2 border-slate-200 bg-white p-5">
        <h3 className="text-lg font-black text-slate-950">Rendez-vous pédagogiques (RVP)</h3>
        <p className="mt-1 text-sm text-slate-500">
          Deux rendez-vous sont obligatoires. Un rendez-vous supplémentaire peut être organisé
          sur conseil de l’enseignant, à la demande de l’élève ou de l’accompagnateur.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleRvp.map((item) => (
            <RvpCard
              isStaff={isStaff}
              item={item}
              key={item.sequence}
              onSave={(patch) => saveRvp(item.sequence, patch)}
              teachers={teachers}
            />
          ))}
        </div>
        <button
          className="mt-4 rounded-xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
          disabled={saving || highestRvpSequence >= AAC_MAX_RVP_COUNT}
          onClick={handleAddRvp}
          type="button"
        >
          Ajouter un rendez-vous pédagogique
        </button>
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

function emptyRvp(sequence) {
  return {
    sequence,
    completed: false,
    heldOn: '',
    companionName: '',
    observations: '',
    teacherId: '',
  }
}

function isShownExtra(item) {
  if (Number(item?.sequence) <= AAC_REQUIRED_RVP_COUNT) return false
  if (item.isAdditional || item.preserveExtraMarker || item.completed || item.heldOn || item.teacherId) return true
  if (String(item.companionName || '').trim()) return true
  if (String(item.observations || '').trim()) return true
  return false
}

function RvpCard({ item, isStaff, teachers, onSave }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        item.completed ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <p className="font-black text-slate-950">
        {item.completed ? '✓ ' : ''}RVP {item.sequence}
      </p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        {item.completed ? 'Effectué' : 'À faire'}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{rvpRequirementLabel(item.sequence)}</p>
      {isStaff ? (
        <div className="mt-3 space-y-2">
          <input
            className="pd-input w-full text-sm"
            type="date"
            value={item.heldOn || ''}
            onChange={(e) => onSave({ heldOn: e.target.value })}
          />
          <select
            className="pd-input w-full text-sm"
            value={item.teacherId || ''}
            onChange={(e) => onSave({ teacherId: e.target.value || null })}
          >
            <option value="">Enseignant…</option>
            {teachers.map((teacher) => (
              <option key={teacher.profile_id || teacher.id} value={teacher.profile_id || teacher.id}>
                {teacher.first_name} {teacher.last_name}
              </option>
            ))}
          </select>
          <input
            className="pd-input w-full text-sm"
            placeholder="Accompagnateur"
            defaultValue={item.companionName}
            onBlur={(e) => {
              if (e.target.value !== (item.companionName || '')) {
                void onSave({ companionName: e.target.value })
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
                void onSave({ observations: e.target.value })
              }
            }}
          />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              checked={Boolean(item.completed)}
              onChange={(e) => onSave({ completed: e.target.checked })}
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
}

function mergeGpsPoints(...groups) {
  const seen = new Set()
  const merged = []
  for (const group of groups) {
    for (const point of group || []) {
      const key = point?.sequenceNo != null
        ? `s:${point.sequenceNo}`
        : `${point?.lat},${point?.lng},${point?.timestamp}`
      if (!point || seen.has(key)) continue
      seen.add(key)
      merged.push(point)
    }
  }
  return merged.sort((a, b) => (Number(a.sequenceNo) || 0) - (Number(b.sequenceNo) || 0))
}

function gpsStatusClass(status) {
  if (status === 'tracking' || status === 'background' || status === 'ready' || status === 'granted') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  }
  if (status === 'paused' || status === 'acquiring' || status === 'weak' || status === 'timeout') {
    return 'border-amber-200 bg-amber-50 text-amber-950'
  }
  if (status === 'denied' || status === 'restricted' || status === 'servicesDisabled' || status === 'unavailable') {
    return 'border-rose-200 bg-rose-50 text-rose-900'
  }
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function formatClock(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatTripDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR')
}

function TripRecap({ trip }) {
  const done = new Set((trip.mandatoryRvp || []).map(Number))
  const extras = trip.extraRvp || []
  const conditions = trip.drivingConditions || []
  return (
    <article className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
      <h4 className="text-base font-black tracking-wide text-slate-950">TRAJET AAC</h4>
      <dl className="mt-3 grid gap-1 text-sm text-slate-700">
        <div className="flex justify-between gap-3"><dt>Date</dt><dd className="font-bold">{formatTripDate(trip.startedAt)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Heure de début</dt><dd className="font-bold">{formatClock(trip.startedAt)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Heure de fin</dt><dd className="font-bold">{formatClock(trip.endedAt)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Durée</dt><dd className="font-bold">{formatDurationMinutes(trip.durationSeconds)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Distance</dt><dd className="font-bold">{formatKm(trip.distanceKm)} km</dd></div>
      </dl>
      <div className="mt-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">RVP obligatoires</p>
        <ul className="mt-1 space-y-1 text-sm text-slate-800">
          {[1, 2].map((sequence) => (
            <li key={sequence}>{done.has(sequence) ? '✓' : '☐'} {mandatoryRvpTitle(sequence)}</li>
          ))}
        </ul>
      </div>
      <div className="mt-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">RVP supplémentaires</p>
        {extras.length ? (
          <ul className="mt-1 space-y-1 text-sm text-slate-800">
            {extras.map((item) => <li key={item.id}>- {item.label}</li>)}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-500">Aucun</p>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Conditions de conduite</p>
        {conditions.length ? (
          <ul className="mt-1 space-y-1 text-sm text-slate-800">
            {conditions.map((id) => <li key={id}>✓ {drivingConditionLabel(id)}</li>)}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-500">Aucune</p>
        )}
      </div>
      <AacTripMap className="mt-3" path={trip.pathSummary} />
    </article>
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
