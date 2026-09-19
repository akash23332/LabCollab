import { Building2, Award } from 'lucide-react'

export default function TrustedInstitutions({ institutions }) {
  return (
    <section
      id="institutions"
      className="border-y border-[#EAE2D4] bg-[#F5EFE6]/60 py-16"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-600">
            Trusted by India's Foremost Research Centres
          </p>
          <p className="text-xs text-stone-600 mt-1">
            Over 140+ central facilities, universities & national laboratories
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 items-center justify-center">
          {institutions.map(({ name, initials, city }) => (
            <div
              key={name}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#E5DAC6] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-emerald-600/50 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF6F0] border border-[#E8DFC0] text-xs font-extrabold text-stone-800 transition group-hover:bg-emerald-700 group-hover:text-white">
                {initials}
              </div>
              <span className="text-xs font-bold text-stone-900 mt-2 text-center truncate max-w-full">
                {name}
              </span>
              <span className="text-[10px] text-stone-600 font-medium">
                {city}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
