import { Sparkles } from 'lucide-react'

export default function PrivateBetaBanner({ isDark = true }) {
  return (
    <div
      className={
        isDark
          ? 'border-b border-white/10 bg-[#07111f]/95 backdrop-blur-sm'
          : 'border-b-2 border-slate-300 bg-slate-50'
      }
      role="status"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-4 text-center sm:flex-row sm:justify-center sm:gap-4 sm:px-6 sm:py-3.5 sm:text-left lg:px-8">
        <span
          className={
            isDark
              ? 'inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-amber-200'
              : 'inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-amber-900'
          }
        >
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
          Bêta privée
        </span>
        <p
          className={`max-w-3xl text-sm leading-6 sm:leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Pedagogia Drive
          </span>{' '}
          accueille un nombre limité d&apos;auto-écoles pilotes pour affiner la plateforme avant le lancement
          officiel.
        </p>
      </div>
    </div>
  )
}
