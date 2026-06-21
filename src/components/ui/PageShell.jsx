export default function PageShell({ children, className = '' }) {
  return (
    <div className={`page-shell pd-page-content ${className}`}>
      {children}
    </div>
  )
}
