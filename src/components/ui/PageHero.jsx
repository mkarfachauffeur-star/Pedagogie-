export default function PageHero({ eyebrow, title, subtitle, actions, children }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
      <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
        {eyebrow && (
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            {eyebrow}
          </span>
        )}
        <div
          className={
            actions
              ? `${eyebrow ? 'mt-5' : ''} flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between`
              : eyebrow
                ? 'mt-4'
                : ''
          }
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
            {subtitle && (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50 md:text-base">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
        </div>
        {children}
      </div>
    </section>
  )
}
