export default function LegalSection({ id, title, children, level = 2 }) {
  const Heading = level === 3 ? 'h3' : 'h2'
  const headingClass =
    level === 3
      ? 'text-sm font-extrabold text-[var(--lp-ink)]'
      : 'text-base font-extrabold text-[var(--lp-ink)]'

  return (
    <section aria-labelledby={id} className="space-y-3">
      <Heading className={headingClass} id={id}>
        {title}
      </Heading>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
