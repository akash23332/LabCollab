import { Microscope } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-[#EAE1D3] bg-[#F8F5EE] py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#241B16] text-[#C58A48] shadow-sm">
            <Microscope className="h-4 w-4" />
          </div>
          <span className="text-base font-bold text-[#241B16] tracking-tight">LabCollab</span>
          <span className="text-xs text-[#8E7E73]">• National Shared Laboratory Grid</span>
        </div>

        <p className="text-xs text-[#736357]">
          &copy; {new Date().getFullYear()} LabCollab. Empowering collaborative scientific discovery across India.
        </p>

        <div className="flex gap-6 text-xs font-semibold text-[#5A4D45]">
          <a href="#features" className="hover:text-[#C58A48] transition">
            Equipment Directory
          </a>
          <a href="#network" className="hover:text-[#C58A48] transition">
            Institutional Network
          </a>
          <a href="#" className="hover:text-[#C58A48] transition">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-[#C58A48] transition">
            Support
          </a>
        </div>
      </div>
    </footer>
  )
}
