import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { App } from '@capacitor/app'
import {
  Building2,
  CloudLightning,
  CloudRain,
  Gauge,
  Moon,
  Mountain,
  Route,
  TrafficCone,
  Trees,
} from 'lucide-react'
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
  traceGpsAwait,
  watchPosition,
} from '../../lib/geolocation'

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
    console.log('[AAC-GPS][TRACE] 1 handleStartTrip entrée')
    console.log('[AAC-GPS] handleStartTrip entrée')
    setError('')
    setSaving(true)
    console.log('[AAC-GPS] saving =', true)
    setGpsStatus('acquiring')
    try {
      console.log('[AAC-GPS][TRACE] 2 avant requestLocationAccess')
      const access = await traceGpsAwait(requestLocationAccess(), 'requestLocationAccess', 100000)
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

      const { trip, error: startError } = await traceGpsAwait(startAacTrip(studentId), 'startAacTrip', 20000)
      if (startError) throw startError
      if (startTokenRef.current !== token) {
        if (trip?.id) await cancelAacTrip(trip.id)
        return
      }

      const details = detailsRef.current
      await traceGpsAwait(saveAacTripDetails(trip.id, details), 'saveAacTripDetails', 20000)
      const seeded = [{ ...fix.position, sequenceNo: 0 }]
      pointBufferRef.current = seeded
      const orgId = organizationId || bundle?.student?.organization_id || trip.organizationId
      await traceGpsAwait(flushPoints(trip.id, orgId), 'flushPoints', 20000)
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
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/70 bg-white/65 px-4 pt-3 shadow-[0_-16px_40px_rgba(56,132,244,0.12)] backdrop-blur-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="mb-2 text-center text-sm text-sky-900/70">
          Trajet en cours
          <span className="text-sky-300"> · </span>
          <span className="font-semibold tabular-nums text-slate-900">{formatKm(liveKm)} km</span>
          <span className="text-sky-300"> · </span>
          <span className="tabular-nums">{formatDuration(elapsed)}</span>
        </p>
        <button
          className="aac-btn-stop w-full touch-manipulation px-5 py-3.5 text-sm font-semibold disabled:opacity-50"
          disabled={stopBusy}
          onClick={handleStopTrip}
          type="button"
        >
          {stopBusy ? 'Arrêt du trajet…' : 'Arrêter le trajet'}
        </button>
      </div>,
      document.body,
    )
    : null

  if (loading) {
    return (
      <>
        {stopBar}
        <p className="text-sm text-slate-500">Chargement du suivi…</p>
      </>
    )
  }

  if (!profile) {
    return (
      <div className="aac-glass px-5 py-4 text-sm leading-6 text-amber-950">
        {stopBar}
        <p>
          Aucun profil de conduite accompagnée.
          {' '}
          {isStaff ? 'Indiquez la date d’entrée pour l’activer.' : 'Contactez le secrétariat.'}
        </p>
        {isStaff && (
          <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={saveStartDate}>
            <label className="text-sm font-medium text-slate-800">
              Date d’entrée
              <input
                className="pd-input mt-1 block bg-white"
                type="date"
                value={startDateDraft}
                onChange={(e) => setStartDateDraft(e.target.value)}
              />
            </label>
            <button className="aac-btn px-4 py-2.5 text-sm font-semibold" type="submit">
              Créer le profil
            </button>
          </form>
        )}
      </div>
    )
  }

  const completedTrips = trips.filter((trip) => trip.status === 'completed')

  return (
    <div className={`flex flex-col gap-4 ${tripActive && !isStaff ? 'pb-28' : ''}`}>
      {stopBar}
      {error && (
        <div className="aac-chip px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <section className="aac-glass">
        <div className="px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="aac-pill">Suivi AAC</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Progression</h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(profile.status)}`}>
              {statusLabel(profile.status)}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            <Stat
              detail={`sur ${progress?.target || 3000} km`}
              label="Parcourus"
              value={`${Math.round(progress?.km || 0)} km`}
            />
            <Stat
              detail="avant l’objectif"
              label="Restants"
              value={`${Math.round(progress?.remaining || 0)} km`}
            />
            <Stat
              detail="terminés"
              label="Trajets"
              value={String(profile.tripCount || 0)}
            />
            <Stat
              detail="obligatoires"
              label="Rendez-vous"
              value={`${countMandatoryRvpCompleted(rvp)}/${AAC_REQUIRED_RVP_COUNT}`}
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Progression kilométrique</span>
              <span className="tabular-nums">{progress?.percent || 0} %</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/55 shadow-[inset_0_1px_2px_rgba(14,116,144,0.12)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.55)]"
                style={{ width: `${Math.min(100, progress?.percent || 0)}%` }}
              />
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/70 pt-4 text-sm lg:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-400">Début</dt>
              <dd className="mt-0.5 text-slate-800">{formatDateFr(profile.startedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Jours écoulés</dt>
              <dd className="mt-0.5 tabular-nums text-slate-800">{daysElapsed ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Jours avant un an</dt>
              <dd className="mt-0.5 tabular-nums text-slate-800">
                {daysToEligible == null ? '—' : Math.max(0, daysToEligible)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Examen possible le</dt>
              <dd className="mt-0.5 text-slate-800">{formatDateFr(profile.examEligibleAt)}</dd>
            </div>
          </dl>
        </div>

        {isStaff && (
          <form className="flex flex-wrap items-end gap-3 border-t border-white/60 px-5 py-4 sm:px-6" onSubmit={saveStartDate}>
            <label className="text-sm font-medium text-slate-700">
              Date d’entrée
              <input
                className="pd-input mt-1 block"
                type="date"
                value={startDateDraft}
                onChange={(e) => setStartDateDraft(e.target.value)}
              />
            </label>
            <button
              className="aac-btn px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              disabled={saving}
              type="submit"
            >
              Enregistrer
            </button>
            {profile.status === 'conditions_remplies' && (
              <button
                className="aac-btn-glass px-4 py-2.5 text-sm font-semibold text-emerald-800 disabled:opacity-40"
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

      <section className="aac-glass p-5 sm:p-6">
            <h3 className="text-base font-semibold text-slate-900">Conditions pour l’examen</h3>
        <ul className="mt-4 space-y-3">
          <Cond ok={conditions?.yearOk} label="Une année complète de conduite accompagnée, jour pour jour" />
          <Cond ok={conditions?.kmOk} label="3 000 km parcourus au minimum" />
          <Cond ok={conditions?.ageOk} label={`17 ans minimum${conditions?.age != null ? ` · ${conditions.age} ans aujourd’hui` : ''}`} />
          <Cond ok={conditions?.rvpOk} label="Les deux rendez-vous pédagogiques obligatoires effectués" />
        </ul>
        {conditions?.allMet && (
          <p className="aac-chip mt-4 px-4 py-3 text-sm text-emerald-900">
            Les conditions sont remplies. L’élève peut être présenté à l’examen du permis de conduire.
          </p>
        )}
      </section>

      {!isStaff && (
        <section className="aac-glass p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Enregistrer un trajet</h3>
            {tripActive && (
              <span className="aac-pill normal-case tracking-normal text-emerald-700">
                En cours
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Le relevé continue si le téléphone est verrouillé. Il s’arrête quand vous terminez le trajet.
          </p>

          <div className={`aac-chip mt-4 px-4 py-3 text-sm leading-6 ${gpsStatusClass(gpsStatus)}`} role="status">
            <p>{LOCATION_STATUS_MESSAGES[gpsStatus] || LOCATION_STATUS_MESSAGES.prompt}</p>
            {tripActive && locationScope === 'whenInUse' && (
              <p className="mt-2 text-xs">
                Pour que les kilomètres continuent à coup sûr écran verrouillé, choisissez Toujours dans Réglages &gt; Pedagogia Drive &gt; Localisation.
              </p>
            )}
            {lastAccuracy != null && tripActive && (
              <p className="mt-1 text-xs opacity-80">
                Précision ± {Math.round(lastAccuracy)} m · {livePoints.length} position{livePoints.length > 1 ? 's' : ''}
              </p>
            )}
            {canOpenLocationSettings() && ['denied', 'restricted', 'servicesDisabled'].includes(gpsStatus) && (
              <button
                className="aac-btn mt-3 px-3 py-2 text-sm font-semibold"
                onClick={openLocationSettings}
                type="button"
              >
                Ouvrir les réglages
              </button>
            )}
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-900">Rendez-vous pendant ce trajet</legend>
            <p className="mt-1 text-sm text-slate-500">
              Cochez un rendez-vous seulement s’il a eu lieu pendant ce trajet. Le dossier officiel n’est pas modifié.
            </p>
            <div className="mt-3 space-y-2">
              {[1, 2].map((sequence) => (
                <label
                  key={sequence}
                  className="aac-chip flex min-h-11 items-start gap-3 px-3 py-3 text-sm text-slate-800"
                >
                  <input
                    checked={mandatoryRvp.includes(sequence)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-sky-500"
                    onChange={() => toggleMandatory(sequence)}
                    type="checkbox"
                  />
                  <span>{mandatoryRvpTitle(sequence)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-900">Rendez-vous supplémentaires</legend>
            <ul className="mt-3 space-y-2">
              {extraRvp.map((item) => (
                <li key={item.id} className="aac-chip flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="text-slate-800">{item.label}</span>
                  <button className="text-xs font-medium text-rose-700" onClick={() => removeExtraRvp(item.id)} type="button">
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
                <button className="aac-btn px-4 py-2.5 text-sm font-semibold" type="submit">
                  Ajouter
                </button>
              </form>
            ) : (
              <button
                className="mt-3 text-sm font-medium text-sky-700"
                onClick={() => setExtraOpen(true)}
                type="button"
              >
                Ajouter un rendez-vous
              </button>
            )}
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-900">Critères de conduite</legend>
            <p className="mt-1 text-sm text-slate-500">Facultatif. Plusieurs critères peuvent être choisis.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
              {AAC_DRIVING_CONDITIONS.map((item) => (
                <DrivingCriterionCard
                  id={item.id}
                  key={item.id}
                  label={item.label}
                  onToggle={() => toggleCondition(item.id)}
                  selected={drivingConditions.includes(item.id)}
                />
              ))}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              className="aac-btn touch-manipulation px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              disabled={saving || tripActive}
              onClick={handleStartTrip}
              type="button"
            >
              {saving ? 'Acquisition GPS…' : 'Démarrer le trajet'}
            </button>
            <button
              className="aac-btn-stop touch-manipulation px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              disabled={stopBusy || !tripActive}
              onClick={handleStopTrip}
              type="button"
            >
              {stopBusy ? 'Arrêt du trajet…' : 'Arrêter le trajet'}
            </button>
          </div>

          {tripActive && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <KpiLight label="Distance" value={`${formatKm(liveKm)} km`} />
              <KpiLight label="Durée" value={formatDuration(elapsed)} />
              <KpiLight label="Positions" value={String(livePoints.length)} />
            </div>
          )}

          {lastTripSummary && (
            <div className="mt-6 border-t border-white/70 pt-4">
              <p className="aac-pill mb-3">Dernier trajet</p>
              <TripRecap trip={lastTripSummary} />
            </div>
          )}
        </section>
      )}

      <section className="aac-glass p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Trajets enregistrés</h3>
          <p className="text-xs tabular-nums text-slate-400">{completedTrips.length}</p>
        </div>
        {!completedTrips.length ? (
          <p className="mt-3 text-sm text-slate-500">Aucun trajet enregistré pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {completedTrips
              .slice(0, isStaff ? 20 : 10)
              .map((trip) => (
                <li key={trip.id} className="aac-chip px-3 py-3">
                  <TripRecap trip={trip} />
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="aac-glass p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Rendez-vous pédagogiques</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
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
          className="aac-btn-glass mt-4 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          disabled={saving || highestRvpSequence >= AAC_MAX_RVP_COUNT}
          onClick={handleAddRvp}
          type="button"
        >
          Ajouter un rendez-vous pédagogique
        </button>
      </section>

      <section className="aac-glass p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Attestation FFI</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Attestation de fin de formation initiale, demandée par l’assurance avant le début de la conduite accompagnée.
        </p>
        {bundle?.ffi?.url ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              className="aac-btn px-4 py-2.5 text-sm font-semibold"
              href={bundle.ffi.url}
              rel="noreferrer"
              target="_blank"
            >
              Télécharger
            </a>
            <span className="text-sm text-slate-500">{bundle.ffi.file_name}</span>
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-800">Aucun document déposé.</p>
        )}
        <label className="aac-btn-glass mt-4 inline-flex cursor-pointer px-4 py-2.5 text-sm font-semibold">
          {bundle?.ffi ? 'Remplacer le PDF' : 'Déposer le PDF'}
          <input accept="application/pdf,.pdf" className="hidden" onChange={handleFfiUpload} type="file" />
        </label>
      </section>
    </div>
  )
}

function Stat({ label, value, detail }) {
  return (
    <div className="aac-chip min-w-0 px-3 py-3">
      <p className="text-xs font-medium text-sky-800/70">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
      {detail ? <p className="mt-0.5 text-xs text-slate-500">{detail}</p> : null}
    </div>
  )
}

function KpiLight({ label, value }) {
  return (
    <div className="aac-chip px-3 py-3">
      <p className="text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="text-xs text-sky-800/70">{label}</p>
    </div>
  )
}

function statusTone(status) {
  if (status === 'conditions_remplies' || status === 'terminee') return 'aac-pill normal-case tracking-normal text-emerald-700'
  return 'aac-pill normal-case tracking-normal text-sky-800'
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
    <article
      className={`aac-chip p-4 ${item.completed ? 'ring-1 ring-emerald-200/80' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900">Rendez-vous {item.sequence}</h4>
        <span className={`text-xs font-medium ${item.completed ? 'text-emerald-700' : 'text-slate-500'}`}>
          {item.completed ? 'Effectué' : 'À faire'}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{rvpRequirementLabel(item.sequence)}</p>
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
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              checked={Boolean(item.completed)}
              className="h-4 w-4 accent-sky-500"
              onChange={(e) => onSave({ completed: e.target.checked })}
              type="checkbox"
            />
            Effectué
          </label>
        </div>
      ) : (
        <dl className="mt-3 space-y-1 text-sm text-slate-600">
          <div className="flex justify-between gap-3">
            <dt>Date</dt>
            <dd className="text-slate-900">{formatDateFr(item.heldOn)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Accompagnateur</dt>
            <dd className="text-right text-slate-900">{item.companionName || '—'}</dd>
          </div>
          {item.observations && <p className="pt-1 text-slate-500">{item.observations}</p>}
        </dl>
      )}
    </article>
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
    return 'border-emerald-200/70 bg-emerald-50/70 text-emerald-950'
  }
  if (status === 'paused' || status === 'acquiring' || status === 'weak' || status === 'timeout') {
    return 'border-amber-200/80 bg-amber-50/70 text-amber-950'
  }
  if (status === 'denied' || status === 'restricted' || status === 'servicesDisabled' || status === 'unavailable') {
    return 'border-rose-200/80 bg-rose-50/70 text-rose-900'
  }
  return 'text-slate-700'
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
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TripRecap({ trip }) {
  const done = new Set((trip.mandatoryRvp || []).map(Number))
  const extras = trip.extraRvp || []
  const conditions = trip.drivingConditions || []
  const tags = [
    ...[1, 2].filter((sequence) => done.has(sequence)).map((sequence) => `RVP ${sequence}`),
    ...extras.map((item) => item.label).filter(Boolean),
    ...conditions.map((id) => drivingConditionLabel(id)),
  ]

  return (
    <article className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          <span className="tabular-nums">{formatKm(trip.distanceKm)} km</span>
          <span className="font-normal text-slate-300"> · </span>
          <span className="font-medium text-slate-700">{formatDuration(trip.durationSeconds)}</span>
        </p>
        {tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <li key={`${tag}-${index}`} className="rounded-full border border-white/80 bg-white/60 px-2.5 py-0.5 text-xs text-sky-900/80">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="shrink-0 text-xs tabular-nums leading-5 text-slate-500 sm:text-right">
        {formatTripDate(trip.startedAt)}
        <span className="mx-1.5 text-slate-300">·</span>
        {formatClock(trip.startedAt)} – {formatClock(trip.endedAt)}
      </p>
    </article>
  )
}

const DRIVING_CRITERIA_LOOK = {
  nuit: { icon: Moon, tone: 'nuit', deco: 'stars' },
  pluie: { icon: CloudRain, tone: 'pluie', deco: 'drops' },
  autoroute: { icon: Route, tone: 'autoroute' },
  voie_rapide: { icon: Gauge, tone: 'voie' },
  agglomeration: { icon: Building2, tone: 'ville' },
  hors_agglomeration: { icon: Trees, tone: 'campagne' },
  circulation_dense: { icon: TrafficCone, tone: 'dense' },
  mauvais_temps: { icon: CloudLightning, tone: 'orage' },
  conditions_difficiles: { icon: Mountain, tone: 'relief' },
}

function DrivingCriterionCard({ id, label, selected, onToggle }) {
  const look = DRIVING_CRITERIA_LOOK[id] || { icon: CloudRain, tone: 'pluie' }
  const Icon = look.icon
  return (
    <button
      aria-pressed={selected}
      className={`aac-criterion aac-criterion--${look.tone}${selected ? ' is-selected' : ''}`}
      onClick={onToggle}
      type="button"
    >
      <span className="aac-criterion__mark" aria-hidden="true">{selected ? '✓' : ''}</span>
      {look.deco === 'drops' && (
        <span className="aac-criterion__drops" aria-hidden="true"><i /><i /><i /></span>
      )}
      {look.deco === 'stars' && (
        <span className="aac-criterion__stars" aria-hidden="true"><i /><i /><i /></span>
      )}
      <span className="aac-criterion__icon" aria-hidden="true">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="aac-criterion__label">{label}</span>
    </button>
  )
}

function Cond({ ok, label }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${
          ok ? 'bg-emerald-100/80 text-emerald-700' : 'bg-white/70 text-sky-300'
        }`}
      >
        {ok ? '✓' : '–'}
      </span>
      <span className={ok ? 'text-slate-900' : 'text-slate-600'}>{label}</span>
    </li>
  )
}
