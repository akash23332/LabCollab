import { iconMap } from '../../utils/iconMap'

export default function StatCard({ label, value, icon, note, badge }) {
  const Icon = iconMap[icon]

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-[#EAE1D3] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 hover:border-[#C58A48]/50">
      {/* Top row: Icon and mini growth badge */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCF7F0] border border-[#EAE1D3] text-[#B37636] transition group-hover:bg-[#241B16] group-hover:text-white group-hover:scale-105">
          {Icon ? <Icon className="h-6 w-6" /> : null}
        </div>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
            {badge}
          </span>
        )}
      </div>

      {/* Number */}
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-extrabold tracking-tight text-[#241B16] sm:text-4xl font-sans">
          {value}
        </p>
      </div>

      {/* Label */}
      <p className="mt-1.5 text-sm font-semibold text-[#241B16]">{label}</p>

      {/* Context note */}
      {note && (
        <p className="mt-2 text-xs font-medium text-[#736357] leading-relaxed">
          {note}
        </p>
      )}

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#EAE1D3] to-transparent opacity-0 transition group-hover:opacity-100 group-hover:via-[#C58A48]" />
    </div>
  )
}
