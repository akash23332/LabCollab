export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  dark = false,
}) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left'
  const titleColor = dark ? 'text-white' : 'text-stone-900'
  const subColor = dark ? 'text-stone-300' : 'text-stone-600'

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          {eyebrow}
        </p>
      )}
      <h2
        className={`text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl font-sans ${titleColor}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed md:text-lg ${subColor}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
