import { motion } from 'framer-motion'

function LogoMark({ compact, idPrefix = 'pd' }) {
  const blueId = `${idPrefix}-logo-blue`
  const redId = `${idPrefix}-logo-red`
  const clipId = `${idPrefix}-logo-road`

  return (
    <svg
      aria-hidden="true"
      className={`shrink-0 ${compact ? 'h-10 w-10' : 'h-12 w-12 sm:h-[3.25rem] sm:w-[3.25rem]'}`}
      fill="none"
      viewBox="0 0 56 56"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={blueId} x1="8" x2="28" y1="52" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a8a" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id={redId} x1="48" x2="28" y1="52" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b91c1c" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
        <clipPath id={clipId}>
          <polygon points="28,6 38,52 18,52" />
        </clipPath>
      </defs>
      <polygon fill={`url(#${blueId})`} points="28,6 6,52 28,52" />
      <polygon fill={`url(#${redId})`} points="28,6 50,52 28,52" />
      <polygon fill="#111827" points="28,6 38,52 18,52" />
      <g clipPath={`url(#${clipId})`}>
        <rect fill="rgba(255,255,255,0.92)" height="3.5" rx="1" width="2.2" x="26.9" y="16" />
        <rect fill="rgba(255,255,255,0.92)" height="4.2" rx="1" width="2.6" x="26.7" y="24" />
        <rect fill="rgba(255,255,255,0.92)" height="5" rx="1" width="3" x="26.5" y="33" />
        <rect fill="rgba(255,255,255,0.92)" height="5.8" rx="1" width="3.4" x="26.3" y="42" />
      </g>
    </svg>
  )
}

function LogoText({ variant = 'marketing' }) {
  if (variant === 'login') {
    return (
      <div className="min-w-0 leading-none">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white sm:text-xs">
          PEDAGOGIA
        </p>
        <p className="mt-1 text-[1.65rem] font-black uppercase tracking-[0.06em] text-[#ef4444] sm:text-[1.85rem]">
          DRIVE
        </p>
      </div>
    )
  }

  if (variant === 'light') {
    return (
      <div className="min-w-0 leading-none">
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-700 sm:text-[11px]">
          PEDAGOGIA
        </p>
        <p className="mt-0.5 text-[1.35rem] font-black uppercase tracking-[0.04em] text-[#ef4444] sm:text-[1.55rem]">
          DRIVE
        </p>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white sm:text-[11px]">
        PEDAGOGIA
      </p>
      <p className="text-[1.35rem] font-black uppercase leading-none tracking-[0.04em] sm:text-[1.55rem]">
        <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          DRI
        </span>
        <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
          VE
        </span>
      </p>
      <div className="mt-1.5 h-[2px] w-full bg-gradient-to-r from-blue-500 via-violet-500 to-red-500" />
    </div>
  )
}

export default function BrandLogo({
  compact = false,
  animated = true,
  variant = 'marketing',
  idPrefix = 'pd',
}) {
  const content = (
    <>
      <LogoMark compact={compact} idPrefix={idPrefix} />
      {!compact && <LogoText variant={variant} />}
    </>
  )

  if (!animated) {
    return <div className="flex items-center gap-3.5">{content}</div>
  }

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3.5"
      initial={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  )
}
