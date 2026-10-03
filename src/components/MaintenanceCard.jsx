import { useTick } from '../lib/useSystemStatus.js'
import { formatCountdown, formatExpected } from '../lib/maintenance.js'

/* The maintenance screen: title, message, and — when an end time is set — a
   countdown from the server's clock. Used for the lock a locked-out panel account
   sees, and for the Super Admin's preview (which shows what the app shows). */
export default function MaintenanceCard({ status, serverNow, compact = false }) {
  useTick(true)
  const lockdown = status.status === 'lockdown'
  const end = status.ends_at ? new Date(status.ends_at).getTime() : null
  const now = serverNow()
  const overdue = end != null && now >= end
  const upcoming = status.status === 'upcoming' && status.starts_at
  const start = status.starts_at ? new Date(status.starts_at).getTime() : null

  return (
    <div style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto', padding: compact ? '8px 0' : '24px 0' }} data-testid="maintenance-card">
      {status.image_url
        ? <img src={status.image_url} alt="" style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain' }} />
        : (
          <div style={{
            width: 84, height: 84, borderRadius: '50%', margin: '0 auto', display: 'grid', placeItems: 'center', fontSize: 40,
            background: lockdown ? 'rgba(220,38,38,.14)' : 'rgba(124,58,237,.14)',
          }}>{lockdown ? '🛡️' : '🔧'}</div>
        )}
      <h2 style={{ margin: '20px 0 8px', fontSize: 22 }}>{status.title || "We'll be right back"}</h2>
      <p style={{ margin: 0, color: 'var(--text-soft)', lineHeight: 1.5 }}>{status.message}</p>

      {upcoming && start != null && (
        <div style={{ marginTop: 22 }}>
          <div className="muted" style={{ fontSize: 12.5 }}>Maintenance starts in</div>
          <div style={{ fontSize: 38, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>
            {formatCountdown(start - now)}
          </div>
        </div>
      )}
      {!upcoming && !lockdown && end != null && (
        overdue ? (
          <div style={{ marginTop: 22 }}>
            <b>This is taking a little longer than expected.</b>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>We'll be back as soon as we can.</div>
          </div>
        ) : (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 40, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: 2 }} data-testid="countdown">
              {formatCountdown(end - now)}
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Expected completion: {formatExpected(status.ends_at, new Date(now))}
            </div>
          </div>
        )
      )}
    </div>
  )
}
