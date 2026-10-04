import { useEffect, useState } from 'react'
import { Modal, Button, useToast } from './ui.jsx'
import { BAN_KINDS, BAN_KIND_KEYS, BAN_DURATIONS, endsOn, banUser, liftUserBans, listUserBans } from '../lib/bans.js'

/* Restrict a user: tick any of Live ban / ID ban / Device ban, pick how long,
   add an internal reason. The reason is for staff — the user is only told the
   type and the end date. The switches start at what is in force now, so
   turning one OFF and pressing Apply lifts that ban; turning one ON adds it. */
export default function BanDialog({ user, defaultKinds = ['account'], onClose, onDone }) {
  const toast = useToast()
  const [kinds, setKinds] = useState(defaultKinds)
  const [active, setActive] = useState(null) // kinds banned right now; null while loading
  const [duration, setDuration] = useState('7d')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    listUserBans(user.id)
      .then((rows) => {
        if (!live) return
        const now = [...new Set(rows.filter((r) => r.state === 'Active').map((r) => r.kind))]
        setActive(now)
        setKinds([...new Set([...now, ...defaultKinds])])
      })
      .catch((e) => { if (live) { setActive([]); setError(`Could not load this user's current bans: ${e?.message || 'unknown error'}`) } })
    return () => { live = false }
  }, [user.id])

  const toAdd = kinds.filter((k) => !(active || []).includes(k))
  const toLift = (active || []).filter((k) => !kinds.includes(k))

  const toggle = (k) => setKinds((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]))

  const submit = async () => {
    if (!toAdd.length && !toLift.length) { setError('Nothing to change'); return }
    setBusy(true)
    setError('')
    try {
      if (toLift.length) await liftUserBans(user.id, 'Lifted from the admin panel', toLift)
      if (toAdd.length) await banUser(user.id, toAdd, duration, reason.trim())
      const parts = [
        ...toLift.map((k) => `${BAN_KINDS[k].label} lifted`),
        ...toAdd.map((k) => `${BAN_KINDS[k].label} applied`),
      ]
      toast(`${user.name}: ${parts.join(', ')}`)
      onDone?.()
      onClose()
    } catch (e) {
      setError(e?.message || 'Could not apply the ban')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={`Restrict ${user.name}`}
      onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" icon={busy ? 'refresh' : 'lock'} disabled={busy || active === null || (!toAdd.length && !toLift.length)} onClick={submit}>
          {busy ? 'Applying…' : 'Apply'}
        </Button>
      </>}
    >
      {error && (
        <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{error}</div>
      )}

      {active && !active.length && (
        <div className="hint" style={{ marginBottom: 10 }}>This user has no active bans. Switch one on to apply it.</div>
      )}
      <div className="field" style={{ marginBottom: 16 }}>
        <label>Type of ban</label>
        {BAN_KIND_KEYS.map((k) => (
          <div className="toggle-row" key={k} style={{ padding: '8px 0' }}>
            <div>
              <div className="t-title">{BAN_KINDS[k].label}</div>
              <div className="t-desc">{BAN_KINDS[k].blurb}</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={kinds.includes(k)} onChange={() => toggle(k)} aria-label={BAN_KINDS[k].label} />
              <span className="track" /><span className="thumb" />
            </label>
          </div>
        ))}
      </div>

      {toAdd.length > 0 && <>
      <div className="field" style={{ marginBottom: 16 }}>
        <label>For how long</label>
        <div className="hstack" style={{ gap: 8 }}>
          {BAN_DURATIONS.map((d) => (
            <Button key={d.value} size="sm" variant={duration === d.value ? 'primary' : undefined} onClick={() => setDuration(d.value)}>
              {d.label}
            </Button>
          ))}
        </div>
        <span className="hint">Ends: {endsOn(duration)}</span>
      </div>

      <div className="field">
        <label>Reason (internal)</label>
        <textarea className="textarea" placeholder="Why — visible to staff only" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      </>}
      {toLift.length > 0 && (
        <div className="hint">Will be lifted: {toLift.map((k) => BAN_KINDS[k].label).join(', ')}.</div>
      )}
    </Modal>
  )
}
