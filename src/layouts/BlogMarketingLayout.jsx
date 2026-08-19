import LandingHeader from '../components/marketing/landing/LandingHeader'
import { LandingFooter } from '../components/marketing/landing/LandingSections'
import { useMarketingTheme } from '../hooks/useMarketingTheme'
import { marketingSkin } from '../lib/marketingTheme'

export default function BlogMarketingLayout({ children }) {
  const { theme, isDark } = useMarketingTheme()

  return (
    <div className="landing-page min-h-screen overflow-x-clip" data-theme={theme}>
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-xl focus:bg-[#1769FF] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        href="#main-content"
      >
        Aller au contenu principal
      </a>
      <LandingHeader />
      <main id="main-content">{children}</main>
      <LandingFooter isDark={isDark} />
    </div>
  )
}

export function useBlogSkin() {
  const { theme } = useMarketingTheme()
  const skin = marketingSkin(theme)
  return {
    isDark: skin.isDark,
    skin: {
      ...skin,
      heading: 'text-[var(--lp-ink)]',
      body: 'text-[var(--lp-muted)]',
      bodyMuted: 'text-[var(--lp-muted)]',
      eyebrowBlue: 'text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1769FF]',
      card: 'rounded-[20px] border border-[var(--lp-border)] bg-[var(--lp-card)]',
      cardHover:
        'group relative overflow-hidden rounded-[20px] border border-[var(--lp-border)] bg-[var(--lp-card)] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#1769FF]/40 hover:shadow-[0_8px_32px_rgba(23,105,255,0.12)]',
      loginBtn:
        'border-2 border-[var(--lp-ink)] bg-[var(--lp-card)] text-[var(--lp-ink)] shadow-sm transition hover:bg-[var(--lp-bg-alt)]',
    },
  }
}
