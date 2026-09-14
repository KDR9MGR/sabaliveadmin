import Avatar from './Avatar.jsx'
import Icon from '../ui/Icon.jsx'

const CHAT = [
  { name: 'Riya', text: 'been waiting for this 🎉', i: 2 },
  { name: 'Kabir', text: 'sent a Star gift ✨', gift: true, i: 3 },
  { name: 'Aman', text: 'lets gooo 🔥', i: 0 },
]

export default function LiveRoomMockup() {
  return (
    <div className="relative flex h-full flex-col justify-between bg-hero-glow pt-11">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2 rounded-full bg-black/40 px-2 py-1.5 pr-3">
          <Avatar name="Meera" size={28} ring index={1} />
          <div className="leading-none">
            <p className="text-[12px] font-semibold text-white">Meera Sings</p>
            <p className="text-[10px] text-ink-secondary">12.4k followers</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-live px-2.5 py-1 text-[10px] font-bold text-white">
            <Icon name="live" size={11} /> LIVE
          </span>
          <span className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white">2.1k</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-2 px-4 pb-3 pt-6">
        {CHAT.map((c, i) => (
          <div key={c.name} className="flex items-start gap-2 rounded-2xl bg-black/30 px-3 py-1.5 max-w-[220px]">
            <Avatar name={c.name} size={20} index={i} />
            <p className="text-[11px] leading-snug text-white">
              <span className="font-semibold text-brand-bright">{c.name}</span>{' '}
              <span className={c.gift ? 'text-gold' : 'text-ink-secondary'}>{c.text}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 bg-black/50 px-3 py-3">
        <div className="flex-1 rounded-full bg-white/10 px-3.5 py-2 text-[11px] text-ink-muted">Say something…</div>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gold">
          <Icon name="gift" size={16} />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-gradient text-white">
          <Icon name="heart" size={15} />
        </button>
      </div>
    </div>
  )
}
