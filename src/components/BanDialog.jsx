import { useState } from 'react'
import { Modal, Button, useToast } from './ui.jsx'
import { BAN_KINDS, BAN_KIND_KEYS, BAN_DURATIONS, endsOn, banUser } from '../lib/bans.js'

/* Restrict a user: tick any of Live ban / ID ban / Device ban, pick how long,
   add an internal reason. The reason is for staff — the user is only told the
   type and the end date. */
export default function BanDialog({ user, defaultKinds = ['account'], onClose, onDone }) {
  const toast = useToast()
  const [kinds, setKinds] = useState(defaultKinds)
  const [duration, setDuration] = useState('7d')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = (k) => setKinds((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]))

  const submit = async () => {
    if (!kinds.length) { setError('Choose at least one type of ban'); return }
    setBusy(true)
    setError('')
    try {
      await banUser(user.id, kinds, duration, reason.trim())
      toast(`${user.name}: ${kinds.map((k) => BAN_KINDS[k].label).join(' + ')} applied`)
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
        <Button variant="danger" icon={busy ? 'refresh' : 'lock'} disabled={busy || !kinds.length} onClick={submit}>
          {busy ? 'Applying…' : 'Apply'}
        </Button>
      </>}
    >
      {error && (
        <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{error}</div>
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
    </Modal>
  )
}
