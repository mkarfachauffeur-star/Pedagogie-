import { motion } from 'framer-motion'

function LogoMark({ compact }) {
  return (
    <img
      alt=""
      className={`shrink-0 object-contain ${compact ? 'h-10 w-10' : 'h-12 w-12 sm:h-[3.25rem] sm:w-[3.25rem]'}`}
      draggable="false"
      src="/brand/pedagogia-drive-p-mark.png"
    />
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
    return <div className="pointer-events-none flex items-center gap-3.5">{content}</div>
  }

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="pointer-events-none flex items-center gap-3.5"
      initial={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  )
}
