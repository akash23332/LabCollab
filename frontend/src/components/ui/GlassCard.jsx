export default function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-white/80 bg-white/85 p-3.5 shadow-xl shadow-stone-900/5 backdrop-blur-md transition-all hover:bg-white/95 ${className}`}
    >
      {children}
    </div>
  )
}
