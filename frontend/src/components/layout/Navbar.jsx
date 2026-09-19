import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Menu, X, Sparkles, Microscope, User, ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import { navLinks } from '../../data/landingData'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, user, openLoginModal } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-[#EAE1D3] bg-[#F8F5EE]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#241B16] to-[#382C25] text-white shadow-md shadow-stone-900/10 group-hover:scale-105 transition">
            <Microscope className="h-5 w-5 text-[#C58A48]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#241B16] flex items-center gap-1.5 font-sans">
              LabCollab
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <span className="text-[10px] font-medium tracking-wider uppercase text-[#736357]">
              National Research Grid
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#5A4D45] transition hover:text-[#241B16]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 rounded-xl border border-[#EAE1D3] bg-white px-3 py-2 text-xs text-[#5A4D45] shadow-xs transition hover:border-[#C58A48] hover:text-[#241B16]"
            >
              <Search className="h-3.5 w-3.5 text-[#736357]" />
              <span>Search 1,850+ instruments...</span>
              <kbd className="rounded border border-stone-200 bg-[#FAF7F2] px-1.5 py-0.5 text-[10px] font-semibold text-[#736357]">
                ⌘K
              </kbd>
            </button>
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard')}
              className="flex items-center gap-2 rounded-xl bg-[#241B16] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#382C25] transition"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#C58A48] text-white text-[10px]">
                {user?.avatar || 'MC'}
              </div>
              <span>Go to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#C58A48]" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-3 py-2 text-sm font-medium text-[#4A3E37] transition hover:text-[#241B16]"
              >
                Log in
              </button>
              <Button
                variant="dark"
                showArrow
                onClick={() => navigate('/signup')}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl border border-[#EAE1D3] bg-white p-2 text-[#5A4D45] hover:bg-[#FAF7F2] lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#EAE1D3] bg-[#F8F5EE] px-6 py-5 lg:hidden">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-2.5 text-base font-medium text-[#4A3E37] hover:text-[#C58A48]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-5 flex flex-col gap-2.5 pt-4 border-t border-[#EAE1D3]">
            {isAuthenticated ? (
              <Button
                variant="dark"
                showArrow
                className="w-full"
                onClick={() => {
                  setOpen(false)
                  navigate(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard')
                }}
              >
                Go to Dashboard ({user?.name})
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setOpen(false)
                    navigate('/login')
                  }}
                >
                  Log in
                </Button>
                <Button
                  variant="dark"
                  showArrow
                  className="w-full"
                  onClick={() => {
                    setOpen(false)
                    navigate('/signup')
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
