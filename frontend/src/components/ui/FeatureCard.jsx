import { ArrowUpRight } from 'lucide-react'
import { iconMap } from '../../utils/iconMap'

const accents = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  violet: 'bg-violet-50 text-violet-700 border-violet-200/80',
  blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
}

export default function FeatureCard({ title, description, icon, accent = 'emerald' }) {
  const Icon = iconMap[icon]

  return (
    <div className="group flex flex-col rounded-3xl border border-[#EAE2D4] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 hover:border-emerald-600/40">
      <div
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${accents[accent] || accents.emerald} transition-transform group-hover:scale-105`}
      >
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
        {description}
      </p>
      <div className="mt-6 flex h-10 w-10 items-center justify-center rounded-full border border-[#E5DAC6] bg-[#FAF8F5] text-stone-400 transition-all group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:translate-x-1">
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </div>
  )
}
