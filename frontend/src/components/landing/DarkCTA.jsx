import { Infinity as InfinityIcon, Building2, Leaf, Sparkles, ArrowRight, ShieldCheck, Mail } from 'lucide-react'
import Button from '../ui/Button'
import ctaBg from '../../assets/cta-bg.jpg'

const pillars = [
  { label: 'Pan-India Equipment Sharing', icon: InfinityIcon },
  { label: '140+ Partner Institutions', icon: Building2 },
  { label: 'Accelerated Scientific Output', icon: Leaf },
]

import { useAuth } from '../../context/AuthContext'

export default function DarkCTA() {
  const { openLoginModal, navigateTo, isAuthenticated } = useAuth()
  return (
    <section className="relative overflow-hidden bg-[#19120F] text-white py-24 lg:py-32">
      {/* High-Resolution Laboratory Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={ctaBg}
          alt="Futuristic Research Laboratory with Laser Spectroscopy"
          className="h-full w-full object-cover object-center brightness-[0.32] scale-105"
        />
        {/* Dual Warm Espresso & Caramel Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#19120F] via-[#19120F]/90 to-[#241B16]/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(197,138,72,0.22),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(179,118,54,0.18),_transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_auto] items-center">
          <div className="max-w-2xl">
            {/* Theme Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C58A48]/40 bg-[#2B211B]/85 px-4 py-1.5 text-xs font-semibold text-[#EED7B3] backdrop-blur-md mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#C58A48]" />
              <span>A Shared Tomorrow for Science</span>
            </div>

            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white font-sans leading-[1.1]">
              Research has no boundaries.
            </h2>

            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-[#FAF6F0]/90">
              Join <span className="font-bold text-[#EED7B3] tracking-wide">LabCollab</span> and be part of a connected, collaborative and innovative research future.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                showArrow
                onClick={() => isAuthenticated ? navigateTo('dashboard') : openLoginModal()}
                className="px-8 py-3.5 text-base font-bold bg-gradient-to-r from-[#C58A48] to-[#B37636] hover:from-[#B37636] hover:to-[#965D25] shadow-xl shadow-[#C58A48]/25 border border-[#EED7B3]/20"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => openLoginModal()}
                className="px-7 py-3.5 text-base font-semibold border-white/25 hover:border-white/50 text-stone-200 hover:bg-white/10"
              >
                <Mail className="h-4 w-4 mr-1.5 text-[#EED7B3]" />
                Contact Us
              </Button>
            </div>

            {/* Feature Badges */}
            <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6 sm:gap-8">
              {pillars.map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2B211B]/80 border border-[#4D3D34]/80 text-[#C58A48] backdrop-blur-md shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#EAE1D3]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Floating Card */}
          <div className="hidden lg:flex flex-col items-center justify-center p-8 rounded-3xl border border-[#4D3D34]/80 bg-[#1F1713]/85 backdrop-blur-xl max-w-xs text-center shadow-2xl shadow-black/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C58A48]/20 border border-[#C58A48]/40 text-[#EED7B3] mb-4 shadow-inner">
              <ShieldCheck className="h-8 w-8 text-[#C58A48]" />
            </div>
            <p className="text-sm font-bold text-white">DST & SERB Aligned</p>
            <p className="mt-1.5 text-xs text-[#FAF6F0]/75 leading-relaxed">
              Standardized booking, audited instrument logs, and transparent institutional invoicing.
            </p>
            <div className="mt-5 pt-5 border-t border-white/10 w-full flex justify-around text-center">
              <div>
                <p className="text-lg font-extrabold text-white">1,850+</p>
                <p className="text-[10px] font-medium text-[#EED7B3] uppercase tracking-wider">Instruments</p>
              </div>
              <div className="h-9 w-px bg-white/15" />
              <div>
                <p className="text-lg font-extrabold text-white">140+</p>
                <p className="text-[10px] font-medium text-[#EED7B3] uppercase tracking-wider">Institutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

