const stores = [
  {
    id: 'ios',
    src: '/brand/badge-app-store.svg',
    alt: "Télécharger sur l'App Store",
    href: import.meta.env.VITE_APP_STORE_URL || '',
  },
  {
    id: 'android',
    src: '/brand/badge-google-play.svg',
    alt: 'Disponible sur Google Play',
    href: import.meta.env.VITE_PLAY_STORE_URL || '',
  },
]

const badgeHeights = {
  compact: 'h-9 sm:h-10',
  default: 'h-11 sm:h-12',
  large: 'h-14 sm:h-16',
}

function StoreBadgeLink({ store, size }) {
  const heightClass = badgeHeights[size] ?? badgeHeights.default
  const hasLink = Boolean(store.href)
  const className =
    'inline-flex items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-md shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400'

  const image = (
    <img
      alt={store.alt}
      className={`${heightClass} w-auto max-w-[min(100%,220px)] object-contain`}
      decoding="async"
      loading="lazy"
      src={store.src}
    />
  )

  const href = hasLink ? store.href : '#contact'
  const external = hasLink

  return (
    <a
      aria-label={hasLink ? store.alt : `${store.alt} — bientôt disponible`}
      className={className}
      href={href}
      rel={external ? 'noopener noreferrer' : undefined}
      target={external ? '_blank' : undefined}
      title={hasLink ? store.alt : 'Application bientôt disponible — contactez-nous'}
    >
      {image}
    </a>
  )
}

export default function StorePlatformBadges({ className = '', size = 'default' }) {
  return (
    <div
      aria-label="Télécharger l'application PEDAGOGIA DRIVE"
      className={`flex flex-wrap items-center justify-center gap-4 sm:gap-6 ${className}`}
      role="group"
    >
      {stores.map((store) => (
        <StoreBadgeLink key={store.id} size={size} store={store} />
      ))}
    </div>
  )
}
