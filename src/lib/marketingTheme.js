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
      : 'sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-2xl shadow-sm',
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
      : 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-300 text-slate-600 transition hover:bg-slate-100',
    menuToggle: isDark
      ? 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 2xl:hidden'
      : 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-300 text-slate-700 2xl:hidden',
    loginBtn: isDark
      ? 'border border-white/15 bg-white/[0.04] text-white backdrop-blur transition hover:bg-white/10'
      : 'border border-slate-300 bg-slate-50 text-slate-900 transition hover:bg-slate-100',
    mobileMenu: isDark
      ? 'border-t border-white/10 bg-[#030712]/95 px-4 py-5 sm:px-6 2xl:hidden'
      : 'border-t border-slate-200 bg-white px-4 py-5 shadow-lg sm:px-6 2xl:hidden',
    mobileNav: isDark
      ? 'flex min-h-11 items-center rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10'
      : 'flex min-h-11 items-center rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100',
    mobileDivider: isDark ? 'border-white/10' : 'border-slate-200',
    mobileLogin: isDark
      ? 'border border-white/25 bg-white/10 text-white hover:bg-white/15'
      : 'border border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100',
    heroBadge: isDark
      ? 'inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-200'
      : 'inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-700',
    heading: isDark ? 'text-white' : 'text-slate-900',
    body: isDark ? 'text-slate-300' : 'text-slate-600',
    bodyMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    listItem: isDark ? 'text-slate-200' : 'text-slate-700',
    sectionAlt: isDark
      ? 'border-y border-white/10 bg-[#07111f]'
      : 'border-y border-slate-200 bg-slate-50',
    card: isDark
      ? 'rounded-[1.25rem] border border-white/10 bg-white/[0.04]'
      : 'rounded-[1.25rem] border border-slate-200 bg-white shadow-sm',
    cardHover: isDark
      ? 'group relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)]'
      : 'group relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg',
    featureRow: isDark
      ? 'flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4'
      : 'flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
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
      : 'border-t border-slate-200 bg-slate-100 px-4 py-10 sm:px-6 lg:px-8',
    footerTitle: isDark ? 'font-black text-white' : 'font-black text-slate-900',
    footerCopy: isDark
      ? 'mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-slate-600'
      : 'mx-auto mt-8 max-w-7xl border-t border-slate-200 pt-6 text-center text-xs text-slate-500',
    brandPedagogia: isDark ? 'text-[10px] font-black uppercase tracking-[0.26em] text-white sm:text-[11px]' : 'text-[10px] font-black uppercase tracking-[0.26em] text-slate-800 sm:text-[11px]',
  }
}
