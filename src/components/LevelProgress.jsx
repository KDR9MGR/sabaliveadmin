/* One track's level on the user page: the level, the XP they have, the XP the next level needs, and how far they are (the same numbers as the app's My Level screen). */
export default function LevelProgress({ card: c }) {
  const n = (x) => Number(x).toLocaleString()
  return (
    <div style={{ minWidth: 220 }}>
      <div className="hstack" style={{ gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <strong>Level {c.level}</strong>
        <span className="muted">{n(c.xp)} XP</span>
        <span className="muted" style={{ fontSize: 12 }}>({c.hint})</span>
      </div>
      {c.hasLadder && (
        <>
          <div className="progress" style={{ marginTop: 6 }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(c.progress * 100)}>
            <span style={{ width: `${Math.round(c.progress * 100)}%` }} />
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {c.maxed
              ? 'Top level: there is no next level'
              : `${n(c.xp)} / ${n(c.next.xp)} XP for Level ${c.next.level} · ${n(c.toNext)} XP to go`}
          </div>
        </>
      )}
      {!c.hasLadder && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>The level list could not be read, so the next level is not shown.</div>}
      {!c.inSync && (
        <div style={{ color: 'var(--danger, #e5484d)', fontSize: 12, marginTop: 4 }}>
          Stored level {c.level}, but {n(c.xp)} XP reaches Level {c.expected}: it corrects itself the next time XP is earned or a level is saved.
        </div>
      )}
    </div>
  )
}
