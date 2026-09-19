import { useState } from 'react'
import { X, Lock, Mail, UserCheck, Microscope, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth()
  const [email, setEmail] = useState('maya.chen@tufts.edu')
  const [password, setPassword] = useState('••••••••')
  const [institution, setInstitution] = useState('Tufts University')
  const [role, setRole] = useState('Researcher')

  if (!isLoginModalOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    login({
      name: 'Maya Chen',
      role,
      institution,
      department: 'Biomedical Engineering',
      email,
      avatar: 'MC',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19120F]/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#EAE1D3] bg-[#FAF8F5] shadow-2xl">
        {/* Top Header Background */}
        <div className="relative bg-[#241B16] px-6 py-6 text-white">
          <button
            type="button"
            onClick={closeLoginModal}
            className="absolute right-4 top-4 rounded-xl p-1.5 text-stone-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-[#C58A48]">
              <Microscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Log in to LabCollab</h3>
              <p className="text-xs text-stone-300">Enter your institutional credentials</p>
            </div>
          </div>
        </div>

        {/* Quick Demo Login Pill */}
        <div className="px-6 pt-5 pb-1">
          <div className="rounded-2xl border border-[#E8DFC0] bg-white p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCF7F0] text-[#C58A48] font-bold text-xs border border-[#EED7B3]">
                MC
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">Maya Chen (Demo User)</p>
                <p className="text-[11px] text-stone-500">Tufts University • Researcher</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => login()}
              className="inline-flex items-center gap-1 rounded-xl bg-[#C58A48] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#B37636] transition"
            >
              <span>Instant Access</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[#E5DAC6] bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 placeholder-stone-400 focus:border-[#C58A48] focus:outline-none focus:ring-1 focus:ring-[#C58A48]"
                placeholder="researcher@university.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-[#E5DAC6] bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 placeholder-stone-400 focus:border-[#C58A48] focus:outline-none focus:ring-1 focus:ring-[#C58A48]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-stone-300 text-[#C58A48] focus:ring-[#C58A48]" />
              <span>Remember this workstation</span>
            </label>
            <a href="#" className="text-xs font-semibold text-[#B37636] hover:underline">Forgot password?</a>
          </div>

          <Button
            variant="dark"
            type="submit"
            className="w-full py-3 text-sm font-bold bg-[#241B16] hover:bg-[#382C25] shadow-lg text-white"
          >
            Sign In to Dashboard
          </Button>

          <p className="text-center text-[11px] text-stone-500 pt-2">
            Protected by Institutional Single Sign-On (SSO) & DST Grid Access
          </p>
        </form>
      </div>
    </div>
  )
}
