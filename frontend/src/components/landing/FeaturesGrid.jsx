import { 
  Search, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Activity, 
  BarChart3, 
  ArrowRight, 
  Lightbulb, 
  MapPin, 
  Calendar, 
  Grid3X3, 
  Check, 
  TrendingUp 
} from 'lucide-react'

export default function FeaturesGrid() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-96 w-[800px] rounded-full bg-[#C58A48]/10 blur-3xl" />

      {/* Header with Hand-Drawn Annotation on Top-Right */}
      <div className="relative mx-auto max-w-3xl text-center mb-16">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C58A48]/30 bg-[#FCF7F0] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#965D25] backdrop-blur-sm mb-4">
          <span>Platform Capabilities</span>
        </div>

        <h2 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl font-sans leading-[1.15]">
          Everything you need to{' '}
          <span className="text-[#C58A48] font-extrabold">share</span> lab infrastructure
        </h2>

        <p className="mt-4 text-base sm:text-lg leading-relaxed text-stone-600">
          From discovery to check-out — one unified platform for researchers, universities, and lab managers.
        </p>

        {/* Decorative Hand-drawn Note (hidden on small screens) */}
        <div className="hidden lg:block absolute -top-2 -right-28 text-left rotate-[6deg]">
          <div className="flex items-center gap-2">
            <svg
              className="h-10 w-10 text-[#C58A48] -rotate-12"
              viewBox="0 0 40 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 30 C 15 15, 25 10, 32 18" />
              <path d="M26 20 L32 18 L30 12" />
            </svg>
            <div className="text-[12px] font-medium leading-tight text-stone-600 italic font-serif">
              Same Equipment.<br />More Possibilities.
            </div>
          </div>
        </div>
      </div>

      {/* 6 Feature Cards Grid - Large Full-Right Cover Mockups */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Card 01: Equipment Discovery */}
        <div className="group relative overflow-hidden rounded-3xl border border-[#EAE1D3] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 hover:border-emerald-500/40 min-h-[310px] flex">
          {/* Full Right Gradient Cover */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[55%] bg-gradient-to-l from-emerald-100/70 via-emerald-50/40 to-transparent" />

          {/* Left Content (48%) */}
          <div className="relative z-10 w-[50%] sm:w-[48%] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-lg font-bold text-emerald-600 block mb-2">01</span>
              <h3 className="text-xl font-bold text-stone-900 leading-snug">Equipment Discovery</h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-stone-500">
                Search high-end instruments across partner labs by technique, resolution, availability, and location.
              </p>
            </div>
            <div className="mt-6">
              <a href="#features" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 transition group-hover:gap-2.5">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Mockup (52%) - Full Cover */}
          <div className="relative z-10 w-[50%] sm:w-[52%] p-4 sm:p-6 flex flex-col justify-between items-end">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-emerald-600 border border-emerald-200/80 shadow-sm backdrop-blur-sm">
              <Search className="h-5 w-5" />
            </div>

            <div className="w-full mt-2 rounded-2xl bg-white/95 p-3 shadow-lg border border-stone-200/70 backdrop-blur-md space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-2.5 py-2 border border-stone-200/60 text-xs text-stone-500">
                <Search className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span className="truncate font-medium">Find equipment...</span>
              </div>
              <div className="flex flex-col gap-1.5 pt-0.5">
                <div className="flex gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-stone-50 border border-stone-200/70 px-2 py-1 text-[10px] font-medium text-stone-700">
                    <Grid3X3 className="h-3 w-3 text-emerald-600" /> Type
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-stone-50 border border-stone-200/70 px-2 py-1 text-[10px] font-medium text-stone-700">
                    <MapPin className="h-3 w-3 text-emerald-600" /> Location
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-stone-50 border border-stone-200/70 px-2 py-1 text-[10px] font-medium text-stone-700 self-start">
                  <Calendar className="h-3 w-3 text-emerald-600" /> Availability
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 02: AI Smart Scheduling */}
        <div className="group relative overflow-hidden rounded-3xl border border-[#EAE1D3] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 hover:border-purple-500/40 min-h-[310px] flex">
          {/* Full Right Gradient Cover */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[55%] bg-gradient-to-l from-purple-100/70 via-purple-50/40 to-transparent" />

          {/* Left Content (48%) */}
          <div className="relative z-10 w-[50%] sm:w-[48%] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-lg font-bold text-purple-600 block mb-2">02</span>
              <h3 className="text-xl font-bold text-stone-900 leading-snug">AI Smart Scheduling</h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-stone-500">
                Intelligent slot allocation algorithms that eliminate idle time and resolve scheduling conflicts.
              </p>
            </div>
            <div className="mt-6">
              <a href="#features" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 transition group-hover:gap-2.5">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Mockup (52%) - Full Cover */}
          <div className="relative z-10 w-[50%] sm:w-[52%] p-4 sm:p-6 flex flex-col justify-between items-end">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-purple-600 border border-purple-200/80 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="w-full mt-2 space-y-2">
              <div className="flex justify-between items-center bg-white/95 rounded-xl p-1.5 border border-purple-100/90 text-[10px] font-semibold text-stone-600 shadow-sm">
                <span className="px-1.5 py-0.5 rounded bg-stone-100">9 AM</span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">11 AM</span>
                <span className="px-1.5 py-0.5 rounded bg-stone-100">1 PM</span>
                <span className="px-1.5 py-0.5 rounded bg-stone-100">3 PM</span>
              </div>
              <div className="rounded-2xl bg-white/95 p-3 border border-purple-100 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-bold text-stone-900">AI Optimal Slot</span>
                </div>
                <p className="mt-1 text-[9.5px] text-stone-500 font-medium">Best time. Best match. Less waiting.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 03: Verified Institutions */}
        <div className="group relative overflow-hidden rounded-3xl border border-[#EAE1D3] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 hover:border-blue-500/40 min-h-[310px] flex">
          {/* Full Right Gradient Cover */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[55%] bg-gradient-to-l from-blue-100/70 via-blue-50/40 to-transparent" />

          {/* Left Content (48%) */}
          <div className="relative z-10 w-[50%] sm:w-[48%] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-lg font-bold text-blue-600 block mb-2">03</span>
              <h3 className="text-xl font-bold text-stone-900 leading-snug">Verified Institutions</h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-stone-500">
                Rigorous peer verification for all participating research facilities, IITs, and universities.
              </p>
            </div>
            <div className="mt-6">
              <a href="#features" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 transition group-hover:gap-2.5">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Mockup (52%) - Full Cover */}
          <div className="relative z-10 w-[50%] sm:w-[52%] p-4 sm:p-6 flex flex-col justify-between items-end">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-blue-600 border border-blue-200/80 shadow-sm backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="w-full mt-2 flex flex-col items-center justify-center rounded-2xl bg-white/95 p-3.5 border border-blue-100 shadow-lg backdrop-blur-md space-y-2">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-bold text-emerald-700 shadow-2xs">
                <Check className="h-3 w-3 text-emerald-600" />
                <span>Verified Institution</span>
              </div>
              <div className="flex flex-col gap-1 w-full px-2 pt-1">
                <div className="h-1.5 w-full bg-stone-100 rounded-full" />
                <div className="h-1.5 w-3/4 bg-stone-100 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 04: Secure QR Check-in */}
        <div className="group relative overflow-hidden rounded-3xl border border-[#EAE1D3] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 hover:border-amber-500/40 min-h-[310px] flex">
          {/* Full Right Gradient Cover */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[55%] bg-gradient-to-l from-amber-100/70 via-amber-50/40 to-transparent" />

          {/* Left Content (48%) */}
          <div className="relative z-10 w-[50%] sm:w-[48%] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-lg font-bold text-amber-600 block mb-2">04</span>
              <h3 className="text-xl font-bold text-stone-900 leading-snug">Secure QR Check-in</h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-stone-500">
                Contactless QR-based session logging with tamper-proof audit trails for every research hour.
              </p>
            </div>
            <div className="mt-6">
              <a href="#features" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 transition group-hover:gap-2.5">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Mockup (52%) - Full Cover */}
          <div className="relative z-10 w-[50%] sm:w-[52%] p-4 sm:p-6 flex flex-col justify-between items-end">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-amber-600 border border-amber-200/80 shadow-sm backdrop-blur-sm">
              <QrCode className="h-5 w-5" />
            </div>

            <div className="w-full flex justify-center items-center">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white p-3.5 border border-stone-200 shadow-xl self-center rotate-[-3deg] group-hover:rotate-0 transition-transform">
                <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-stone-900 rounded-xl text-white h-full w-full">
                  <div className="bg-white rounded-xs" />
                  <div className="bg-white/20 rounded-xs" />
                  <div className="bg-white/60 rounded-xs" />
                  <div className="bg-white rounded-xs" />
                  <div className="bg-white/40 rounded-xs" />
                  <div className="bg-white rounded-xs" />
                  <div className="bg-white/20 rounded-xs" />
                  <div className="bg-white/80 rounded-xs" />
                  <div className="bg-white rounded-xs" />
                  <div className="bg-white/30 rounded-xs" />
                  <div className="bg-white rounded-xs" />
                  <div className="bg-white rounded-xs" />
                  <div className="bg-white/50 rounded-xs" />
                  <div className="bg-white rounded-xs" />
                  <div className="bg-white/20 rounded-xs" />
                  <div className="bg-white rounded-xs" />
                </div>
                {/* Laser scan line with glow */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 05: Real-time Telemetry */}
        <div className="group relative overflow-hidden rounded-3xl border border-[#EAE1D3] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 hover:border-rose-500/40 min-h-[310px] flex">
          {/* Full Right Gradient Cover */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[55%] bg-gradient-to-l from-rose-100/70 via-rose-50/40 to-transparent" />

          {/* Left Content (48%) */}
          <div className="relative z-10 w-[50%] sm:w-[48%] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-lg font-bold text-rose-600 block mb-2">05</span>
              <h3 className="text-xl font-bold text-stone-900 leading-snug">Real-time Telemetry</h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-stone-500">
                Live dashboards tracking instrument operational status, booking queues, and power utilization.
              </p>
            </div>
            <div className="mt-6">
              <a href="#features" className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 transition group-hover:gap-2.5">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Mockup (52%) - Full Cover */}
          <div className="relative z-10 w-[50%] sm:w-[52%] p-4 sm:p-6 flex flex-col justify-between items-end">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-rose-600 border border-rose-200/80 shadow-sm backdrop-blur-sm">
              <Activity className="h-5 w-5" />
            </div>

            <div className="w-full mt-2 rounded-2xl bg-white/95 p-3 border border-rose-100 shadow-lg backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" /> Live
                </span>
                <span className="text-[9.5px] text-stone-400 font-medium">Telemetry</span>
              </div>
              <svg viewBox="0 0 160 38" className="w-full h-8 overflow-visible">
                <path
                  d="M0 20 Q 25 2, 50 18 T 90 10 T 130 24 T 160 6"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex items-center justify-between text-[9.5px] text-stone-600 font-semibold border-t border-stone-100 pt-1.5">
                <span>⭕ 72% Utilization</span>
                <span>🌡️ 24°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 06: Predictive Lab Analytics */}
        <div className="group relative overflow-hidden rounded-3xl border border-[#EAE1D3] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 hover:border-teal-500/40 min-h-[310px] flex">
          {/* Full Right Gradient Cover */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[55%] bg-gradient-to-l from-teal-100/70 via-teal-50/40 to-transparent" />

          {/* Left Content (48%) */}
          <div className="relative z-10 w-[50%] sm:w-[48%] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-lg font-bold text-teal-600 block mb-2">06</span>
              <h3 className="text-xl font-bold text-stone-900 leading-snug">Predictive Lab Analytics</h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-stone-500">
                Deep insights on research demand patterns to optimize shared national scientific infrastructure.
              </p>
            </div>
            <div className="mt-6">
              <a href="#features" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 transition group-hover:gap-2.5">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Mockup (52%) - Full Cover */}
          <div className="relative z-10 w-[50%] sm:w-[52%] p-4 sm:p-6 flex flex-col justify-between items-end">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-teal-600 border border-teal-200/80 shadow-sm backdrop-blur-sm">
              <BarChart3 className="h-5 w-5" />
            </div>

            <div className="w-full mt-2 rounded-2xl bg-white/95 p-3 border border-teal-100 shadow-lg backdrop-blur-md space-y-2">
              <div className="flex items-end justify-between h-14 px-2.5 bg-stone-50/80 rounded-xl border border-teal-100/60 pt-2">
                <div className="w-3.5 bg-teal-200 rounded-t h-4" />
                <div className="w-3.5 bg-teal-300 rounded-t h-7" />
                <div className="w-3.5 bg-teal-400 rounded-t h-10" />
                <div className="w-3.5 bg-teal-600 rounded-t h-13" />
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200/80 px-2 py-1">
                <TrendingUp className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                <span className="text-[9.5px] font-bold text-stone-800 truncate">More research. More impact.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Banner */}
      <div className="mt-14 overflow-hidden rounded-3xl border border-[#EAE1D3] bg-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FCF7F0] border border-[#C58A48]/30 text-[#C58A48] shadow-sm">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-stone-900">
                Shared infrastructure creates unlimited possibilities.
              </h4>
              <p className="mt-1 text-xs sm:text-sm text-stone-500">
                Join a network that believes in accessible, collaborative and innovative research.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#network"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#241B16] px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:bg-[#382C25] active:scale-95"
            >
              <span>Explore the Network</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#network"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D5CABE] bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-[#FAF6F0] active:scale-95"
            >
              Partner with LabCollab
            </a>
          </div>
        </div>
      </div>

    </section>
  )
}

