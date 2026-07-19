/** Carte SVG simple d’un trajet (polyline) — sans dépendance lourde. */
export default function AacTripMap({ path = [], className = '' }) {
  const points = (path || [])
    .map((p) => (Array.isArray(p) ? { lat: p[0], lng: p[1] } : p))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))

  if (points.length < 2) {
    return (
      <div className={`flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500 ${className}`}>
        Pas assez de points GPS pour afficher la carte.
      </div>
    )
  }

  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const pad = 0.0008
  const w = 400
  const h = 220

  const toXy = (lat, lng) => {
    const x = ((lng - (minLng - pad)) / ((maxLng + pad) - (minLng - pad) || 1)) * w
    const y = (1 - (lat - (minLat - pad)) / ((maxLat + pad) - (minLat - pad) || 1)) * h
    return [x, y]
  }

  const d = points
    .map((p, i) => {
      const [x, y] = toXy(p.lat, p.lng)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const [sx, sy] = toXy(points[0].lat, points[0].lng)
  const [ex, ey] = toXy(points[points.length - 1].lat, points[points.length - 1].lng)

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${className}`}>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-48 w-full" role="img" aria-label="Carte du trajet">
        <rect width={w} height={h} fill="#f8fafc" />
        <path d={d} fill="none" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={sx} cy={sy} r="5" fill="#16a34a" />
        <circle cx={ex} cy={ey} r="5" fill="#dc2626" />
      </svg>
    </div>
  )
}
