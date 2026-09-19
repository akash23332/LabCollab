import { ArrowRight } from 'lucide-react'

const variants = {
  primary:
    'bg-[#C58A48] text-white hover:bg-[#B37636] shadow-md shadow-[#C58A48]/25 active:scale-[0.98]',
  secondary:
    'bg-white text-stone-800 border border-[#E5DCCE] hover:border-stone-400 hover:bg-[#FAF8F5] shadow-sm active:scale-[0.98]',
  warm:
    'bg-[#F5EFE6] text-stone-900 border border-[#E8DFC0] hover:bg-[#EFE7DA] shadow-sm active:scale-[0.98]',
  dark:
    'bg-[#241B16] text-white hover:bg-[#382C25] shadow-md shadow-stone-900/20 active:scale-[0.98]',
  ghost:
    'border border-white/30 text-white hover:bg-white/15 backdrop-blur-sm active:scale-[0.98]',
  accent:
    'bg-[#B37636] text-white hover:bg-[#965D25] shadow-md shadow-[#B37636]/20 active:scale-[0.98]',
  emerald:
    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-700/20 active:scale-[0.98]',
}

export default function Button({
  variant = 'primary',
  children,
  showArrow = false,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
      {showArrow && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
    </button>
  )
}
