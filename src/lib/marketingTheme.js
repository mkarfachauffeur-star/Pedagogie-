const lightOutline = 'border-2 border-slate-300'
const lightOutlineBlue = 'border-2 border-blue-300'
const lightDivider = 'border-slate-300'

export function marketingSkin(theme) {
  const isDark = theme !== 'light'

  return {
    isDark,
    page: isDark
      ? 'min-h-screen overflow-x-clip bg-[#030712] text-white'
      : 'min-h-screen overflow-x-clip bg-white text-slate-900',
    ambient: isDark
      ? 'pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(37,99,235,0.18),transparent_30%),radial-gradient(circle_at_78%_16%,rgba(220,38,38,0.12),transparent_32%),linear-gradient(135deg,#020617_0%,#071426_56%,#0c1020_100%)]'
      : 'pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(37,99,235,0.08),transparent_32%),radial-gradient(circle_at_78%_16%,rgba(220,38,38,0.06),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#ffffff_50%,#eff6ff_100%)]',
    header: isDark
      ? 'sticky top-0 z-50 border-b border-white/10 bg-[#030712]/80 backdrop-blur-2xl'
      : `sticky top-0 z-50 border-b-2 ${lightDivider} bg-white/90 backdrop-blur-2xl shadow-sm`,
    navLink: (active) =>
      [
        'relative inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition 2xl:px-3.5',
        isDark ? 'hover:bg-white/5 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900',
        active
          ? isDark
            ? 'text-white'
            : 'text-slate-900'
          : isDark
            ? 'text-slate-300'
            : 'text-slate-600',
      ].join(' '),
    themeToggle: isDark
      ? 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 text-amber-300 transition hover:bg-white/10'
      : 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-400 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50',
    menuToggle: isDark
      ? 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 2xl:hidden'
      : `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${lightOutline} bg-white text-slate-700 shadow-sm 2xl:hidden`,
    loginBtn: isDark
      ? 'border border-white/15 bg-white/[0.04] text-white backdrop-blur transition hover:bg-white/10'
      : `${lightOutline} bg-slate-50 text-slate-900 shadow-sm transition hover:bg-slate-100 hover:border-slate-400`,
    mobileMenu: isDark
      ? 'border-t border-white/10 bg-[#030712]/95 px-4 py-5 sm:px-6 2xl:hidden'
      : `border-t-2 ${lightDivider} bg-white px-4 py-5 shadow-lg sm:px-6 2xl:hidden`,
    mobileNav: isDark
      ? 'flex min-h-11 items-center rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10'
      : 'flex min-h-11 items-center rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100',
    mobileDivider: isDark ? 'border-white/10' : lightDivider,
    mobileLogin: isDark
      ? 'border border-white/25 bg-white/10 text-white hover:bg-white/15'
      : `${lightOutline} bg-slate-50 text-slate-900 shadow-sm hover:border-slate-400 hover:bg-slate-100`,
    heroBadge: isDark
      ? 'inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-200'
      : `inline-flex items-center gap-2 rounded-full ${lightOutlineBlue} bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-800 shadow-sm`,
    heading: isDark ? 'text-white' : 'text-slate-900',
    body: isDark ? 'text-slate-300' : 'text-slate-600',
    bodyMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    listItem: isDark ? 'text-slate-200' : 'text-slate-700',
    sectionAlt: isDark
      ? 'border-y border-white/10 bg-[#07111f]'
      : `border-y-2 ${lightDivider} bg-slate-50`,
    card: isDark
      ? 'rounded-[1.25rem] border border-white/10 bg-white/[0.04]'
      : `rounded-[1.25rem] ${lightOutline} bg-white shadow-sm`,
    cardHover: isDark
      ? 'group relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)]'
      : `group relative overflow-hidden rounded-[1.25rem] ${lightOutline} bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg`,
    featureRow: isDark
      ? 'flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4'
      : `flex gap-4 rounded-2xl ${lightOutline} bg-white p-4 shadow-sm`,
    upcomingTitle: isDark ? 'font-black text-slate-200' : 'font-black text-slate-800',
    upcomingText: isDark ? 'mt-1 text-sm leading-6 text-slate-500' : 'mt-1 text-sm leading-6 text-slate-500',
    eyebrowBlue: isDark ? 'text-xs font-black uppercase tracking-[0.16em] text-blue-300' : 'text-xs font-black uppercase tracking-[0.16em] text-blue-600',
    eyebrowEmerald: isDark ? 'text-xs font-black uppercase tracking-[0.16em] text-emerald-300' : 'text-xs font-black uppercase tracking-[0.16em] text-emerald-600',
    roleLabel: isDark ? 'text-[11px] font-black uppercase tracking-[0.12em] text-blue-300/80' : 'text-[11px] font-black uppercase tracking-[0.12em] text-blue-600/80',
    contactGlow: isDark
      ? 'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.12),transparent_45%)]'
      : 'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.06),transparent_45%)]',
    footer: isDark
      ? 'border-t border-white/10 bg-[#020817] px-4 py-10 sm:px-6 lg:px-8'
      : `border-t-2 ${lightDivider} bg-slate-100 px-4 py-10 sm:px-6 lg:px-8`,
    footerTitle: isDark ? 'font-black text-white' : 'font-black text-slate-900',
    footerCopy: isDark
      ? 'mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-slate-600'
      : `mx-auto mt-8 max-w-7xl border-t-2 ${lightDivider} pt-6 text-center text-xs text-slate-500`,
    brandPedagogia: isDark ? 'text-[10px] font-black uppercase tracking-[0.26em] text-white sm:text-[11px]' : 'text-[10px] font-black uppercase tracking-[0.26em] text-slate-800 sm:text-[11px]',
    loginFormCard: isDark
      ? 'relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c1424]/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8'
      : `relative overflow-hidden rounded-[1.75rem] ${lightOutline} bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.1)] ring-1 ring-slate-300 sm:p-8`,
    loginLabel: isDark ? 'block text-sm font-bold text-slate-200' : 'block text-sm font-bold text-slate-800',
    loginInputWrap: isDark
      ? 'mt-2 flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#070d18] px-4 py-3'
      : `mt-2 flex items-center gap-2.5 rounded-xl ${lightOutline} bg-white px-4 py-3 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20`,
    loginInput: isDark
      ? 'w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600'
      : 'w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400',
    loginMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    loginSubtle: isDark ? 'text-slate-500' : 'text-slate-400',
    loginLink: isDark ? 'font-semibold text-blue-400 transition hover:text-blue-300' : 'font-semibold text-blue-600 transition hover:text-blue-700',
    loginBackLink: isDark ? 'text-sm font-bold text-blue-400 transition hover:text-blue-300' : 'text-sm font-bold text-blue-600 transition hover:text-blue-700',
    loginFooterBorder: isDark ? 'border-white/10' : `border-t-2 ${lightDivider}`,
    loginForgotBox: isDark
      ? 'rounded-xl border border-blue-400/25 bg-blue-500/10 p-4 text-sm leading-6 text-slate-300'
      : `rounded-xl ${lightOutlineBlue} bg-blue-50 p-4 text-sm leading-6 text-slate-700`,
    loginHeroBadge: isDark
      ? 'inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-200'
      : `inline-flex items-center gap-2 rounded-full ${lightOutlineBlue} bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-800 shadow-sm`,
    loginFeatureIcon: isDark
      ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-blue-300'
      : `flex h-10 w-10 items-center justify-center rounded-xl ${lightOutlineBlue} bg-blue-50 text-blue-600`,
    loginFeatureTitle: isDark ? 'mt-3 text-sm font-black text-white' : 'mt-3 text-sm font-black text-slate-900',
    loginFeatureText: isDark ? 'mt-1 text-xs leading-5 text-slate-500' : 'mt-1 text-xs leading-5 text-slate-500',
    loginError: isDark
      ? 'rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200'
      : 'rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700',
  }
}
