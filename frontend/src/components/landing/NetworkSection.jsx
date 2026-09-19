import { useState } from 'react'
import { Users, Zap, TrendingUp, Building2, MapPin, Sparkles, Microscope, Search, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import GlassCard from '../ui/GlassCard'
import { networkNodes, networkLegend, indiaInstitutions } from '../../data/landingData'

const pills = [
  { label: 'Pan-India Access', icon: Zap },
  { label: 'Cross-Institute Sharing', icon: Users },
  { label: 'Standardized Rates', icon: TrendingUp },
]

export default function NetworkSection() {
  const [selectedInstituteId, setSelectedInstituteId] = useState(indiaInstitutions[0].id)
  const [searchFilter, setSearchFilter] = useState('')

  const activeInstitute =
    indiaInstitutions.find((i) => i.id === selectedInstituteId) || indiaInstitutions[0]

  const filteredInstitutions = indiaInstitutions.filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      inst.location.toLowerCase().includes(searchFilter.toLowerCase()) ||
      inst.featuredInstruments.some((tool) =>
        tool.toLowerCase().includes(searchFilter.toLowerCase())
      )
  )

  return (
    <section id="network" className="relative bg-[#FAF8F5] py-20 lg:py-28 border-y border-[#EBE3D5] overflow-hidden">
      {/* Warm Ambient Accents */}
      <div className="pointer-events-none absolute top-10 right-10 h-72 w-72 rounded-full bg-[#C58A48]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-10 h-72 w-72 rounded-full bg-[#B37636]/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <SectionHeader
              eyebrow="PAN-INDIA RESEARCH GRID"
              title="One network. Infinite discoveries."
              subtitle="Seamlessly access central research facilities, specialized characterization suites, and high-performance labs across Indian institutions."
            />
            <div className="mt-6 flex flex-wrap gap-2.5">
              {pills.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E5DCCE] bg-[#F7F2E9] px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-[#C58A48]" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#E5DCCE] px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C58A48] animate-pulse" />
              <span>140+ Institutions Connected</span>
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Left is Institutions Directory Card, Right is India Map */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Left Column: Institutions Across India Card (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-3xl border border-[#E8DFC0] bg-white p-5 shadow-lg shadow-stone-900/5">
              <div className="flex items-center justify-between pb-4 border-b border-[#EFE8DC]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FCF7F0] text-[#C58A48] border border-[#EED7B3]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Institutions Across India</h3>
                    <p className="text-[11px] text-stone-500">Select an institute to view on map</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#FAF5EC] border border-[#ECE0CE] px-2.5 py-1 text-[11px] font-bold text-stone-700">
                  {indiaInstitutions.length} Featured
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mt-3.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter by institute, city, or equipment (e.g., TEM, NMR)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#E5DAC6] bg-[#FAF8F5] py-2 pl-9 pr-3 text-xs text-stone-800 placeholder-stone-400 focus:border-[#C58A48] focus:outline-none focus:ring-1 focus:ring-[#C58A48]"
                />
              </div>

              {/* Institutions List with Scroll */}
              <div className="mt-3.5 space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredInstitutions.map((inst) => {
                  const isSelected = inst.id === selectedInstituteId
                  return (
                    <div
                      key={inst.id}
                      onClick={() => setSelectedInstituteId(inst.id)}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                        isSelected
                          ? 'border-[#C58A48] bg-[#FCF7F0] shadow-sm'
                          : 'border-[#EFE8DC] bg-white hover:border-stone-300 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">{inst.name}</span>
                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold border ${inst.badgeColor}`}>
                              {inst.tier}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-500">
                            <MapPin className="h-3 w-3 text-[#C58A48] shrink-0" />
                            <span>{inst.location}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block rounded-lg bg-[#FAF5EC] border border-[#E8DFC0] px-2 py-0.5 text-[10px] font-bold text-[#965D25]">
                            {inst.equipmentCount} Tools
                          </span>
                        </div>
                      </div>

                      {/* Featured Instruments Tags */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {inst.featuredInstruments.map((tool) => (
                          <span
                            key={tool}
                            className="rounded-md bg-white border border-[#E5DAC6] px-1.5 py-0.5 text-[10px] text-stone-600"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-[#EED7B3] flex items-center justify-between text-[11px] text-[#965D25] font-medium">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#C58A48]" />
                            {inst.activeBookings}
                          </span>
                          <span className="font-bold underline text-[#B37636]">Highlighted on Map &rarr;</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: India Interactive Network Map (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-3xl border border-[#E8DFC0] bg-gradient-to-br from-[#FAF6F0] via-white to-[#F2EBDC] p-6 md:p-8 shadow-xl shadow-stone-900/5">
              
              {/* Top Map Bar */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#965D25]">
                    Live Telemetry & Inter-Facility Grid
                  </p>
                  <p className="text-xs text-stone-500">Interactive India Scientific Hub Map</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-[#C58A48] animate-ping" />
                  <span className="text-[11px] font-semibold text-[#965D25]">Grid Synchronized</span>
                </div>
              </div>

              {/* SVG Map Container */}
              <div className="relative min-h-[360px] md:min-h-[420px] w-full flex items-center justify-center">
                <svg
                  viewBox="0 0 400 340"
                  className="h-full w-full max-w-[500px]"
                  aria-hidden="true"
                >
                  <defs>
                    <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#C58A48" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#C58A48" stopOpacity="0" />
                    </radialGradient>
                    <pattern
                      id="warmDots"
                      x="0"
                      y="0"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="1.5" cy="1.5" r="1" fill="#D6C7B2" />
                    </pattern>
                  </defs>

                  {/* Stylized India Geographical Polygon Geometry */}
                  <path
                    d="M140 30 L170 20 L200 45 L225 70 L250 110 L275 130 L290 145 L270 160 L245 165 L230 190 L210 230 L180 280 L165 310 L155 285 L140 240 L120 200 L105 170 L95 130 L110 85 L130 50 Z"
                    fill="url(#warmDots)"
                    stroke="#D6C7B2"
                    strokeWidth="1.2"
                    opacity="0.75"
                  />

                  {/* Interconnecting Beam Lines Between Major Research Corridors */}
                  {networkNodes.map((node, i) => {
                    const next = networkNodes[(i + 2) % networkNodes.length]
                    return (
                      <line
                        key={`beam-${node.city}-${i}`}
                        x1={node.x}
                        y1={node.y}
                        x2={next.x}
                        y2={next.y}
                        stroke="#C58A48"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.45"
                      />
                    )
                  })}

                  {/* Main Corridor Line */}
                  {networkNodes.slice(0, -1).map((node, i) => {
                    const next = networkNodes[i + 1]
                    return (
                      <line
                        key={`line-${node.city}`}
                        x1={node.x}
                        y1={node.y}
                        x2={next.x}
                        y2={next.y}
                        stroke="#B37636"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity="0.65"
                      />
                    )
                  })}

                  {/* Interactive Nodes */}
                  {networkNodes.map((node) => {
                    const isFocus = node.institutes.some(instName => activeInstitute.name.includes(instName) || activeInstitute.location.includes(node.state))
                    return (
                      <g
                        key={node.city}
                        className="cursor-pointer transition-transform"
                      >
                        {/* Outer Pulse */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isFocus ? '18' : '10'}
                          fill="#C58A48"
                          opacity={isFocus ? '0.4' : '0.15'}
                          className={isFocus ? 'animate-ping' : ''}
                        />
                        {/* Middle Glow */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isFocus ? '8' : '5'}
                          fill={isFocus ? '#B37636' : '#C58A48'}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        {/* Node City Label */}
                        <text
                          x={node.x + 10}
                          y={node.y + 4}
                          fontSize={isFocus ? '10' : '8.5'}
                          fontWeight={isFocus ? 'bold' : 'normal'}
                          fill={isFocus ? '#965D25' : '#57534E'}
                          className="select-none font-sans"
                        >
                          {node.city.split(' ')[0]}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                {/* Floating Map Badge of Active Selected Institute */}
                <GlassCard className="absolute bottom-3 left-3 right-3 md:right-auto md:max-w-xs z-20 border-[#E5DCCE] shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#241B16] text-[#EED7B3] font-bold text-xs shadow-md">
                      {activeInstitute.name.split(' ')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {activeInstitute.name}
                        </p>
                        <span className="text-[10px] font-bold text-amber-700">★ {activeInstitute.rating}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 truncate">{activeInstitute.fullName}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[#965D25]">
                          {activeInstitute.equipmentCount} Instruments Active
                        </span>
                        <a
                          href="#features"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B37636] hover:underline"
                        >
                          Book Slot &rarr;
                        </a>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Bottom Network Legend Pills */}
              <div className="mt-4 pt-4 border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-2">
                {networkLegend.map(({ city, color, count }) => (
                  <div
                    key={city}
                    className="flex items-center gap-1.5 text-[11px] text-stone-600"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="font-medium text-stone-800">{city}</span>
                    <span className="text-[10px] text-stone-400">({count})</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

