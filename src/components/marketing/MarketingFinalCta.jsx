import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { LANDING_FINAL_CTA } from '../../lib/marketingContent'
import { trackDemoRequestClick } from '../../lib/analytics'

function reveal(shouldReduceMotion) {
  return {
    initial: shouldReduceMotion ? undefined : { opacity: 0, y: 20 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, ease: 'easeOut' },
  }
}

export default function MarketingFinalCta({ isDark, skin, shouldReduceMotion }) {
  return (
    <section className="relative overflow-hidden py-16 lg:py-20">
      <div className={skin.contactGlow} />
      <motion.div
        {...reveal(shouldReduceMotion)}
        className={`relative mx-auto max-w-3xl rounded-[1.75rem] border px-6 py-12 text-center sm:px-10 ${
          isDark
            ? 'border-white/10 bg-white/[0.04] shadow-2xl shadow-blue-950/30'
            : 'border-slate-200 bg-white shadow-xl'
        }`}
      >
        <h2 className={`text-2xl font-black sm:text-3xl ${skin.heading}`}>{LANDING_FINAL_CTA.title}</h2>
        <p className={`mt-4 text-base leading-8 ${skin.bodyMuted}`}>{LANDING_FINAL_CTA.subtitle}</p>
        <a
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 sm:w-auto"
          href="#demonstration"
          onClick={() => trackDemoRequestClick('final_cta')}
        >
          {LANDING_FINAL_CTA.button}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </a>
      </motion.div>
    </section>
  )
}
