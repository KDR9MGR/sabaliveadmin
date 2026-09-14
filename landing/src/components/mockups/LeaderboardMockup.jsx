import Avatar from './Avatar.jsx'
import Icon from '../ui/Icon.jsx'

const RANKS = [
  { name: 'Priya K.', score: '84.2k', rank: 4 },
  { name: 'Sana R.', score: '79.8k', rank: 5 },
  { name: 'Dev Malhotra', score: '71.4k', rank: 6 },
]

export default function LeaderboardMockup() {
  return (
    <div className="flex h-full flex-col bg-hero-glow px-4 pt-14">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-white">Weekly Leaderboard</p>
        <Icon name="trophy" size={16} className="text-gold" />
      </div>

      <div className="mt-5 flex items-end justify-center gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <Avatar name="Aarav" size={40} index={2} />
          <div className="flex h-14 w-16 items-end justify-center rounded-t-lg bg-card pb-1">
            <span className="text-[11px] font-bold text-ink-secondary">2</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-gold"><Icon name="trophy" size={18} /></span>
          <Avatar name="Zara" size={48} ring index={4} />
          <div className="flex h-20 w-16 items-end justify-center rounded-t-lg bg-gold-gradient pb-1">
            <span className="text-[11px] font-bold text-[#241300]">1</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Avatar name="Ishan" size={40} index={0} />
          <div className="flex h-10 w-16 items-end justify-center rounded-t-lg bg-card pb-1">
            <span className="text-[11px] font-bold text-ink-secondary">3</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {RANKS.map((r, i) => (
          <div key={r.name} className="flex items-center gap-2.5 rounded-xl bg-card px-3 py-2">
            <span className="w-4 text-[11px] font-semibold text-ink-muted">{r.rank}</span>
            <Avatar name={r.name} size={26} index={i + 1} />
            <span className="flex-1 truncate text-[11px] text-ink-secondary">{r.name}</span>
            <span className="text-[11px] font-semibold text-gold">{r.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
