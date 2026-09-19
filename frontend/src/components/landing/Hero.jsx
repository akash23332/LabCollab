import Button from '../ui/Button'
import { iconMap } from '../../utils/iconMap'
import GlassCard from '../ui/GlassCard'
import { heroFloatingCards } from '../../data/landingData'
import heroMicroscope from '../../assets/hero-microscope.jpg'
import { CheckCircle2, Sparkles, Shield, Compass, ArrowRight } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

export default function Hero() {
  const { openLoginModal, navigateTo, isAuthenticated } = useAuth()
  return (
    <section className="relative overflow-hidden bg-[#F8F5EE] pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Warm Ambient Glows */}
      <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-[#C58A48]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-0 h-96 w-96 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(247,236,217,0.5)_0%,_transparent_70%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-12 lg:gap-8">
        {/* Left Column: Headline & Value Proposition */}
        <div className="lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EAE1D3] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4A3E37] shadow-sm backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>India's Shared Laboratory Network</span>
            <span className="text-stone-300">•</span>
            <span className="text-emerald-700 font-bold">140+ Research Hubs</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.12] tracking-tight text-[#241B16] sm:text-5xl lg:text-6xl font-sans">
            Access more than a{' '}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 bg-gradient-to-r from-[#B37636] via-[#C58A48] to-emerald-700 bg-clip-text text-transparent">
                campus.
              </span>
              <span className="absolute bottom-1.5 left-0 -z-0 h-3 w-full bg-[#F7ECD9] rounded" />
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#5A4D45]">
            Book certified electron microscopes, NMR spectrometers, XRD systems, and cleanrooms across India’s premier institutions — with AI scheduling and verified operator handoff.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              variant="dark"
              showArrow
              onClick={() => isAuthenticated ? navigateTo('dashboard') : openLoginModal()}
              className="px-6 py-3 text-base shadow-lg shadow-stone-900/15"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Explore 1,850+ Instruments'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => openLoginModal()}
              className="px-6 py-3 text-base"
            >
              List Your Facility
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 pt-8 border-t border-[#EAE1D3] flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {[
                  { label: 'IISc', bg: 'bg-emerald-700 text-white' },
                  { label: 'IITD', bg: 'bg-[#B37636] text-white' },
                  { label: 'IITB', bg: 'bg-teal-700 text-white' },
                  { label: 'TIFR', bg: 'bg-[#241B16] text-white' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold shadow-sm ${item.bg}`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[#241B16]">140+ Partner Institutions</p>
                <p className="text-stone-500">IISc, IITs, CSIR, AIIMS & R&D labs</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>Verified Operator Assistance</span>
            </div>
          </div>
        </div>

        {/* Right Column: High Quality Microscope Photo & Dynamic Overlays */}
        <div className="relative lg:col-span-6">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            {/* Ambient Background Glow Behind Photo */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#EED7B3]/40 via-emerald-100/40 to-[#EAE1D3] blur-xl opacity-80" />

            {/* Photo Container */}
            <div className="relative overflow-hidden rounded-3xl border border-[#EAE1D3] bg-white shadow-2xl shadow-stone-900/10">
              <img
                src={heroMicroscope}
                alt="Advanced Electronic Microscope Laboratory at LabCollab Partner Facility"
                className="h-[380px] w-full object-cover sm:h-[440px] lg:h-[480px] brightness-[0.98] transition duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#19120F]/70 via-transparent to-[#19120F]/10 pointer-events-none" />

              {/* In-Image Top Pill */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full border border-white/30 bg-[#241B16]/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Feed: Central Nano Lab</span>
              </div>

              {/* In-Image Bottom Caption */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between rounded-xl border border-white/20 bg-[#241B16]/85 p-3 text-white backdrop-blur-md">
                <div>
                  <p className="text-xs font-semibold text-stone-100">Scanning Electron Microscope (SEM)</p>
                  <p className="text-[11px] text-stone-300">0.8nm Resolution • Cryo-Stage Ready</p>
                </div>
                <span className="rounded-lg bg-emerald-600/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                  Instant Slot
                </span>
              </div>
            </div>

            {/* Floating Glass Card 1: Top Right */}
            <GlassCard className="absolute -top-4 -right-2 md:-right-6 z-20 max-w-[210px] hidden sm:block border-[#EAE1D3]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FCF7F0] text-[#B37636]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#241B16]">AI Slot Optimizer</p>
                  <p className="text-[11px] text-stone-500">Zero idle-time conflicts</p>
                </div>
              </div>
            </GlassCard>

            {/* Floating Glass Card 2: Bottom Left */}
            <GlassCard className="absolute -bottom-6 -left-2 md:-left-6 z-20 max-w-[230px] hidden sm:block border-[#EAE1D3]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#241B16]">Verified Operator</p>
                  <p className="text-[11px] text-stone-500">Trained technician assistance</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  )
}

