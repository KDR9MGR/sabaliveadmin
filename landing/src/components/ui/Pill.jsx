export default function Pill({ children, tone = 'default', className = '' }) {
  const tones = {
    default: 'bg-white/5 text-ink-secondary border-stroke',
    live: 'bg-live/15 text-live border-live/30',
    gold: 'bg-gold/15 text-gold border-gold/30',
    brand: 'bg-brand/15 text-brand-bright border-brand/30',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}
