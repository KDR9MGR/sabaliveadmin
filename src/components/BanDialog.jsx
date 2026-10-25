import { useEffect, useState } from 'react'
import { Modal, Button, useToast } from './ui.jsx'
import { BAN_KINDS, BAN_KIND_KEYS, BAN_DURATIONS, endsOn, banUser, liftUserBans, listUserBans } from '../lib/bans.js'
import { banTerms, toLocalInput } from '../lib/banRules.js'

/* Restrict a user: tick any of Live ban / ID ban / Device ban, pick how long
   (24 hours, 7 days, 30 days, a date and time of your choice, or permanent), and
   give a reason. The reason is SHOWN TO THE USER when they try to sign in, with
   the end date, so write it for them (staff notes belong elsewhere). The switches
   start at what is in force now, so turning one OFF and pressing Apply lifts that
   ban; turning one ON adds it. */
export default function BanDialog({ user, defaultKinds = ['account'], onClose, onDone }) {
  const toast = useToast()
  const [kinds, setKinds] = useState(defaultKinds)
  const [active, setActive] = useState(null) // kinds banned right now; null while loading
  const [duration, setDuration] = useState('7d')
  const [customEnd, setCustomEnd] = useState('') // datetime-local text, in this browser's time zone
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
    const terms = toAdd.length ? banTerms(duration, customEnd) : null
    if (terms?.error) { setError(terms.error); return }
    setBusy(true)
    setError('')
    try {
      if (toLift.length) await liftUserBans(user.id, 'Lifted from the admin panel', toLift)
      if (toAdd.length) await banUser(user.id, toAdd, terms.duration, reason.trim(), terms.endsAt)
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
        <div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>
          {BAN_DURATIONS.map((d) => (
            <Button key={d.value} size="sm" variant={duration === d.value ? 'primary' : undefined} onClick={() => setDuration(d.value)}>
              {d.label}
            </Button>
          ))}
        </div>
        {duration === 'custom' && (
          <input
            className="input" type="datetime-local" style={{ marginTop: 8 }} aria-label="Ban ends on"
            min={toLocalInput(new Date(Date.now() + 10 * 60000))}
            value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
          />
        )}
        <span className="hint">Ends: {endsOn(duration, new Date(), customEnd)}{duration === 'custom' && customEnd ? ' (your time zone)' : ''}</span>
      </div>

      <div className="field">
        <label>Reason (shown to the user)</label>
        <textarea className="textarea" maxLength={500} placeholder="Why — the user sees this, with the end date, when they try to sign in" value={reason} onChange={(e) => setReason(e.target.value)} />
        <span className="hint">Optional. Keep it short and polite; do not put private staff notes here.</span>
      </div>
      </>}
      {toLift.length > 0 && (
        <div className="hint">Will be lifted: {toLift.map((k) => BAN_KINDS[k].label).join(', ')}.</div>
      )}
    </Modal>
  )
}
