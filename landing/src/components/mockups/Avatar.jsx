const GRADIENTS = [
  'from-[#7C3AED] to-[#F5279B]',
  'from-[#F5279B] to-[#FFA63C]',
  'from-[#3AA0FF] to-[#7C3AED]',
  'from-[#32D583] to-[#3AA0FF]',
  'from-[#FFC93C] to-[#F5279B]',
]

export default function Avatar({ name = '?', size = 40, ring = false, index = 0 }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const g = GRADIENTS[index % GRADIENTS.length]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${g} font-semibold text-white ${ring ? 'ring-2 ring-live' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}
