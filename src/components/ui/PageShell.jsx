export default function PageShell({ children, className = '' }) {
  return (
    <div className={`page-shell mx-auto flex w-full max-w-7xl flex-col gap-6 ${className}`}>
      {children}
    </div>
  )
}
