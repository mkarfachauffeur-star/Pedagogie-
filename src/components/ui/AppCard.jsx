import { forwardRef } from 'react'

function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

/**
 * Enveloppe optionnelle — délègue aux utilitaires CSS sans imposer de layout.
 *
 * Préférer directement :
 * - card-surface / card-tile / card-panel / card-panel-lg
 * - glass-card / glass-card-lg
 * - card-muted / card-inner / card-list-item
 */
export const AppCard = forwardRef(function AppCard(
  {
    as: Component = 'div',
    hover = false,
    glass = false,
    panel = false,
    className = '',
    children,
    ...props
  },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={cn(
        glass && 'glass-card',
        panel && 'card-panel',
        !glass && !panel && 'card-surface',
        hover && 'card-hover',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
})
