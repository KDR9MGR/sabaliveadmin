export default function SectionHeading({ eyebrow, title, sub, align = 'center', className = '' }) {
  const alignCls = align === 'left' ? 'text-left items-start' : 'text-center items-center mx-auto'
  return (
    <div className={`flex flex-col ${alignCls} max-w-2xl gap-4 ${className}`}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-stroke bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-bright">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-ink-primary">{title}</h2>
      {sub && <p className="text-base sm:text-lg text-ink-secondary leading-relaxed">{sub}</p>}
    </div>
  )
}
