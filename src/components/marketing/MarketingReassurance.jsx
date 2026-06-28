import { CheckCircle2 } from 'lucide-react'

export default function MarketingReassurance({ items, skin, isDark }) {
  const iconWrap = isDark
    ? 'inline-flex rounded-xl border border-blue-400/25 bg-blue-500/10 p-2 text-blue-300'
    : 'inline-flex rounded-xl border border-blue-300 bg-blue-50 p-2 text-blue-600'

  return (
    <section aria-labelledby="reassurance-heading" className="mx-auto max-w-7xl" id="pourquoi">
      <div className="mx-auto max-w-2xl text-center">
        <p className={skin.eyebrowBlue}>Nos engagements</p>
        <h2 className={`mt-3 text-2xl font-black sm:text-3xl ${skin.heading}`} id="reassurance-heading">
          Pourquoi choisir Pedagogia Drive ?
        </h2>
        <p className={`mt-4 text-base leading-8 ${skin.bodyMuted}`}>
          Une plateforme pédagogique conçue pour les auto-écoles qui veulent moderniser leur livret
          numérique sans sacrifier le suivi pédagogique.
        </p>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li className={`${skin.card} p-5`} key={item.title}>
            <div className={iconWrap}>
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            </div>
            <h3 className={`mt-4 text-base font-black ${skin.heading}`}>{item.title}</h3>
            <p className={`mt-2 text-sm leading-7 ${skin.bodyMuted}`}>{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
