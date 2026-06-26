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
          <span className={`font-bold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
            🚧 Version bêta en développement
          </span>
          {' — '}
          Pedagogia Drive est actuellement en phase de développement et de tests auprès
          d&apos;auto-écoles partenaires. Certaines fonctionnalités peuvent encore évoluer
          avant la version finale.
        </p>
      </div>
    </div>
  )
}
