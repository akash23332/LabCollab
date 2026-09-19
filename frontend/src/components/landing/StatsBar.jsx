import StatCard from '../ui/StatCard'

export default function StatsBar({ stats }) {
  return (
    <section className="relative -mt-4 mb-8 z-20 mx-auto max-w-7xl px-6">
      <div className="rounded-3xl border border-[#EAE1D3] bg-[#FAF7F2] p-4 md:p-6 shadow-sm backdrop-blur-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  )
}
