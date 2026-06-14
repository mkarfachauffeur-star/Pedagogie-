export default function PanelTabs({ tabs, activeId, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
            activeId === tab.id
              ? 'bg-navy-950 text-white shadow-md'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-800'
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
          {tab.badge != null && tab.badge > 0 ? (
            <span className="ml-2 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-black text-cyan-800">
              {tab.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
