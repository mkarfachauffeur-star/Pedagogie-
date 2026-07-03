export default function BetaDevelopmentBanner({ isDark = true }) {
  return (
    <div
      className={
        isDark
          ? 'border-b border-white/10 bg-[#07111f]/95 backdrop-blur-sm'
          : 'border-b-2 border-slate-300 bg-slate-50'
      }
      role="status"
    >
      <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
        <p
          className={`text-center text-sm leading-6 sm:text-left ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          <span className={`font-bold ${isDark ? 'text-cyan-200' : 'text-cyan-800'}`}>
            Version 1
          </span>
          {' — '}
          Pedagogia Drive est disponible en Version 1 pour les auto-écoles.
        </p>
      </div>
    </div>
  )
}
