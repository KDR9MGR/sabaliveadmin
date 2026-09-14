import Icon from '../ui/Icon.jsx'

const HISTORY = [
  { label: 'Gift received — Rose', delta: '+120', kind: 'diamond' },
  { label: 'Coin top-up', delta: '+2,000', kind: 'coin' },
  { label: 'Withdrawal', delta: '−4,500', kind: 'out' },
]

export default function WalletMockup() {
  return (
    <div className="flex h-full flex-col gap-4 bg-bg px-4 pt-14">
      <p className="text-[13px] font-semibold text-white">Wallet</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-stroke bg-card p-3.5">
          <div className="flex items-center gap-1.5 text-gold">
            <Icon name="star" size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Coins</span>
          </div>
          <p className="mt-2 text-lg font-bold text-white">18,240</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-card p-3.5">
          <div className="flex items-center gap-1.5 text-diamond">
            <Icon name="sparkles" size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Diamonds</span>
          </div>
          <p className="mt-2 text-lg font-bold text-white">6,050</p>
        </div>
      </div>

      <button className="w-full rounded-full bg-primary-gradient py-2.5 text-[12px] font-semibold text-white shadow-glow">
        Withdraw
      </button>

      <div className="flex flex-col gap-2.5 pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Recent activity</p>
        {HISTORY.map((h) => (
          <div key={h.label} className="flex items-center justify-between rounded-xl bg-card px-3 py-2.5">
            <span className="text-[11px] text-ink-secondary">{h.label}</span>
            <span
              className={`text-[11px] font-semibold ${
                h.kind === 'out' ? 'text-danger' : h.kind === 'coin' ? 'text-gold' : 'text-diamond'
              }`}
            >
              {h.delta}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
