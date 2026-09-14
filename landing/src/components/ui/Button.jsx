import { Link } from 'react-router-dom'

const VARIANTS = {
  primary:
    'bg-primary-gradient text-white shadow-glow hover:brightness-110 active:brightness-95',
  secondary:
    'bg-white/5 text-ink-primary border border-stroke hover:bg-white/10 hover:border-brand-bright/50',
  ghost:
    'text-ink-primary hover:text-white',
  gold:
    'bg-gold-gradient text-[#241300] shadow-glow-gold hover:brightness-105',
}

const SIZES = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

/* Renders an internal <Link>, an external/mailto <a>, or a <button> —
   whichever fits `to`/`href`/`onClick`. Pill-shaped, matches the app's
   StadiumBorder button language. */
export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${VARIANTS[variant]} ${SIZES[size]} ${className}`

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    )
  }
  if (href) {
    const external = /^https?:\/\//.test(href) || href.startsWith('mailto:')
    return (
      <a
        href={href}
        className={cls}
        target={external && !href.startsWith('mailto:') ? '_blank' : undefined}
        rel={external && !href.startsWith('mailto:') ? 'noopener noreferrer' : undefined}
        {...rest}
      >
        {children}
      </a>
    )
  }
  const Tag = as || 'button'
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  )
}
