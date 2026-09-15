/* Small inline icon set — no icon-library dependency. */
const PATHS = {
  live: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4.9 4.9a11 11 0 0 0 0 14.2M19.1 4.9a11 11 0 0 1 0 14.2M7.8 7.8a6.5 6.5 0 0 0 0 8.4M16.2 7.8a6.5 6.5 0 0 1 0 8.4',
  video: 'M23 7l-7 5 7 5V7ZM1 5h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1V5Z',
  gift: 'M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M2 7h20v5H2zM12 21V7M12 7S10.5 3 8 3a2 2 0 0 0 0 4M12 7s1.5-4 4-4a2 2 0 0 1 0 4',
  trophy: 'M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4ZM7 4H4a3 3 0 0 0 3 3M17 4h3a3 3 0 0 1-3 3',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  wallet: 'M2 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v1H4V7Zm0 3h18v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8Zm14 3.5h2.5',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  gamepad: 'M6 12h4M8 10v4M15 11h.01M18 13h.01M6 8h12a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4c-1 0-1.5-.5-2.5-1.5S16 15 15 15H9c-1 0-1.5.5-2.5 1.5S5 18 4 18a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4Z',
  check: 'M20 6 9 17l-5-5',
  checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  play: 'M8 5v14l11-7L8 5Z',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm3.5-14.5-2.5 6-6 2.5 2.5-6 6-2.5Z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z',
  sparkles: 'M12 3v4M12 17v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M3 12h4M17 12h4M4.2 19.8 7 17M17 7l2.8-2.8',
  idCard: 'M2 6h20v12H2zM7 10h.01M7 14h4M15 9h4M15 13h4M15 17h4',
  building: 'M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1',
  chevronDown: 'M6 9 12 15 18 9',
  mail: 'M4 4h16v16H4zM22 6l-10 7L2 6',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 10 0v4',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16ZM10 11v6M14 11v6',
}

export default function Icon({ name, size = 22, className = '', strokeWidth = 1.8 }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
