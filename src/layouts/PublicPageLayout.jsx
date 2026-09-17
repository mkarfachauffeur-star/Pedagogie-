import LandingHeader from '../components/marketing/landing/LandingHeader'
import { LandingFooter } from '../components/marketing/landing/LandingSections'
import { useMarketingTheme } from '../hooks/useMarketingTheme'

export default function PublicPageLayout({ title, children }) {
  const { theme, isDark } = useMarketingTheme()

  return (
    <div className="landing-page flex min-h-screen flex-col overflow-x-clip" data-theme={theme}>
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-xl focus:bg-[#0F5CE8] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        href="#main-content"
      >
        Aller au contenu principal
      </a>
      <LandingHeader />

      <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8" id="main-content">
        <article className="mx-auto w-full max-w-3xl rounded-[20px] border border-[var(--lp-border)] bg-[var(--lp-card)] p-6 text-[var(--lp-ink)] shadow-sm md:p-8">
          <h1 className="text-3xl font-extrabold text-[var(--lp-ink)]">{title}</h1>
          <div className="prose-public mt-8 space-y-8 text-sm leading-7 text-[var(--lp-muted)]">{children}</div>
        </article>
      </main>

      <LandingFooter isDark={isDark} />
    </div>
  )
}
