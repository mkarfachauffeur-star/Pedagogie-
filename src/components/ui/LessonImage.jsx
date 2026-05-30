import { ImageOff } from 'lucide-react'
import { useState } from 'react'

export default function LessonImage({
  alt = '',
  className = '',
  fallbackLabel = 'Illustration indisponible',
  objectFit = 'cover',
  src,
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        aria-label={alt || fallbackLabel}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 ${className}`}
        role="img"
      >
        <ImageOff aria-hidden="true" className="h-8 w-8 opacity-60" />
        <span className="px-3 text-center text-xs font-semibold">{fallbackLabel}</span>
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      loading="lazy"
      onError={() => setFailed(true)}
      src={src}
      style={objectFit === 'contain' ? { objectFit: 'contain' } : { objectFit: 'cover' }}
    />
  )
}
