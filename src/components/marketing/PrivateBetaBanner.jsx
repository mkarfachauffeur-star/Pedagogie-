export default function PrivateBetaBanner({ isDark = true }) {
  return (
    <div
      className={
        isDark
          ? 'border-b border-amber-400/25 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 px-4 py-3 text-center backdrop-blur-sm'
          : 'border-b border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100 px-4 py-3 text-center'
      }
      role="status"
    >
      <p className={`text-sm font-black ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
        🚧 Version Bêta Privée
      </p>
      <p
        className={`mx-auto mt-1 max-w-3xl text-xs leading-6 sm:text-sm sm:leading-7 ${
          isDark ? 'text-amber-100/90' : 'text-amber-800/90'
        }`}
      >
        Pedagogia Drive est actuellement en phase de développement et de tests avec plusieurs enseignants
        et auto-écoles partenaires. Certaines fonctionnalités sont encore en cours d&apos;amélioration
        avant le lancement officiel.
      </p>
    </div>
  )
}
