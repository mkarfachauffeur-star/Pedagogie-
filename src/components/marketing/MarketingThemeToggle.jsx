import { Moon, Sun } from 'lucide-react'

export default function MarketingThemeToggle({ isDark, onToggle, className = '' }) {
  return (
    <button
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      className={className}
      onClick={onToggle}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      type="button"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
