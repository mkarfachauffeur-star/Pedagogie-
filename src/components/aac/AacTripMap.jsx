import { useMemo } from 'react'
import { buildDisplayTrace } from '../../lib/gpsDisplayTrace.js'

/**
 * Tracé visuel du trajet. Les points affichés sont filtrés ici ;
 * la distance enregistrée n’utilise pas ce composant.
 */
export default function AacTripMap({ path = [], className = '' }) {
  const points = useMemo(() => buildDisplayTrace(path), [path])

  if (points.length < 2) return null

  const lats = points.map((point) => point[0])
  const lngs = points.map((point) => point[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latSpan = Math.max(maxLat - minLat, 0.00045)
  const lngSpan = Math.max(maxLng - minLng, 0.00045)
  const padLat = latSpan * 0.14
  const padLng = lngSpan * 0.14
  const south = minLat - padLat
  const north = maxLat + padLat
  const west = minLng - padLng
  const east = maxLng + padLng
  const width = 400
  const height = 220

  const toXy = (lat, lng) => {
    const x = ((lng - west) / (east - west || 1)) * width
    const y = (1 - (lat - south) / (north - south || 1)) * height
    return [x, y]
  }

  const d = points
    .map((point, index) => {
      const [x, y] = toXy(point[0], point[1])
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const [startX, startY] = toXy(points[0][0], points[0][1])
  const [endX, endY] = toXy(points.at(-1)[0], points.at(-1)[1])

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/80 bg-white/45 ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Tracé du trajet">
        <rect width={width} height={height} fill="#f4f9ff" />
        <path d={d} fill="none" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={startX} cy={startY} r="5" fill="#16a34a" />
        <circle cx={endX} cy={endY} r="5" fill="#e11d48" />
      </svg>
    </div>
  )
}
