import { useEffect, useState } from 'react'
import { PageHeader, Card, Button, Modal, ConfirmDialog, useToast } from '../components/ui.jsx'
import MaintenanceCard from '../components/MaintenanceCard.jsx'
import { useSystemStatus, useTick } from '../lib/useSystemStatus.js'
import {
  setMaintenance, endMaintenance, emergencyLockdown, logoutAllAppUsers, logoutAllAdmins,
  formatCountdown, toLocalInput, fromLocalInput,
} from '../lib/maintenance.js'
import { uploadMedia } from '../lib/storage.js'

const PILL = {
  online: { label: 'ONLINE', bg: '#16a34a' },
  upcoming: { label: 'MAINTENANCE SCHEDULED', bg: '#2563eb' },
  maintenance: { label: 'MAINTENANCE', bg: '#d97706' },
  lockdown: { label: 'LOCKDOWN', bg: '#dc2626' },
}
const EMPTY = {
  title: "We'll be right back",
  message: "Saba Live is down for scheduled maintenance. We'll be back shortly.",
  imageUrl: '', startsAt: '', endsAt: '', autoEnd: false, lockApp: true, blockLogins: true, lockPanel: false,
}

/* Super Admin → System Control → Maintenance. */
export function Maintenance() {
  const toast = useToast()
  const { status, serverNow, refresh } = useSystemStatus({ pollMs: 15000 })
  const [form, setForm] = useState(EMPTY)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState(null) // 'enable' | 'users' | 'admins' | 'lockdown' | 'preview'
  const [lockMessage, setLockMessage] = useState('')
  useTick(true)

  // fill the form from what is saved (once)
  useEffect(() => {
    if (!status || loaded) return
    setForm({
      title: status.title || EMPTY.title,
      message: status.message || EMPTY.message,
      imageUrl: status.image_url || '',
      startsAt: toLocalInput(status.starts_at),
      endsAt: toLocalInput(status.ends_at),
      autoEnd: !!status.auto_end,
      lockApp: status.lock_app !== false,
      blockLogins: status.block_logins !== false,
      lockPanel: !!status.lock_panel,
    })
    setLoaded(true)
  }, [status, loaded])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const state = status?.status || 'online'
  const pill = PILL[state] || PILL.online
  const active = state !== 'online'
  const now = serverNow()
  const endMs = status?.ends_at ? new Date(status.ends_at).getTime() : null
  const startMs = status?.starts_at ? new Date(status.starts_at).getTime() : null

  const run = async (fn, okMsg) => {
    setBusy(true)
    try { await fn(); toast(okMsg); await refresh(); setDialog(null) }
    catch (e) { toast(e.message || 'That did not work') }
    finally { setBusy(false) }
  }

  const enable = () => run(() => setMaintenance({
    ...form, startsAt: fromLocalInput(form.startsAt), endsAt: fromLocalInput(form.endsAt),
  }), form.startsAt && new Date(form.startsAt).getTime() > Date.now() ? 'Maintenance scheduled' : 'Maintenance is ON')

  const addMinutes = (m) => set('endsAt', toLocalInput(new Date((form.startsAt ? new Date(form.startsAt).getTime() : Date.now()) + m * 60000).toISOString()))
  const upload = async (file) => {
    try { set('imageUrl', await uploadMedia('gift-assets', 'maintenance', file)) } catch (e) { toast(e.message || 'Upload failed') }
  }
  const startsInFuture = form.startsAt && new Date(form.startsAt).getTime() > Date.now()
  const previewStatus = {
    status: 'maintenance', title: form.title, message: form.message, image_url: form.imageUrl || null,
    ends_at: fromLocalInput(form.endsAt) || null, starts_at: null, server_time: new Date().toISOString(),
  }

  return (
    <>
      <PageHeader title="Maintenance" crumbs={['Home', 'System Control', 'Maintenance']} />

      {/* ---------------------------------------------------------------- status */}
      <Card title="System status" className="mb-16">
        <div className="hstack" style={{ gap: 16, flexWrap: 'wrap' }}>
          <span style={{ background: pill.bg, color: '#fff', borderRadius: 999, padding: '6px 14px', fontWeight: 700, fontSize: 13 }}>● {pill.label}</span>
          {state === 'upcoming' && startMs != null && <span>Starts in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCountdown(startMs - now)}</b></span>}
          {state === 'maintenance' && endMs != null && (
            now >= endMs
              ? <span>Past the end time — still locked until you end it</span>
              : <span>Ends in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCountdown(endMs - now)}</b></span>
          )}
          {state === 'lockdown' && <span>Everyone but you is locked out until you end it</span>}
          <div className="grow" />
          {active && <Button variant="primary" icon="check" disabled={busy} onClick={() => run(endMaintenance, 'Back online')}>End maintenance now</Button>}
        </div>
        {active && (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
            {status?.lock_app || state === 'lockdown' ? 'The app is locked for every user. ' : 'The app is still usable. '}
            {status?.lock_panel || state === 'lockdown' ? 'Panel staff are locked out too (you never are). ' : 'Panel staff are not locked. '}
            {status?.block_logins ? 'New sign-ins and sign-ups are blocked.' : ''}
          </p>
        )}
      </Card>

      {/* ---------------------------------------------------------------- settings */}
      <Card title="Maintenance settings" sub="Shown on the maintenance screen in the app. Saving turns maintenance on (or updates it while it is on)." className="mb-16">
        <div className="form-grid">
          <div className="field full">
            <label>Title</label>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="field full">
            <label>Message</label>
            <textarea className="textarea" value={form.message} onChange={(e) => set('message', e.target.value)} />
          </div>
          <div className="field">
            <label>Starts</label>
            <input className="input" type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
            <span className="hint">Leave empty to start the moment you save. A future time schedules it: users see a countdown notice first.</span>
          </div>
          <div className="field">
            <label>Expected to end</label>
            <input className="input" type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
            <div className="hstack" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {[15, 30, 60, 120].map((m) => <Button key={m} size="sm" onClick={() => addMinutes(m)}>{m < 60 ? `${m} min` : `${m / 60} h`} {form.startsAt ? 'after start' : 'from now'}</Button>)}
              {form.endsAt && <Button size="sm" onClick={() => set('endsAt', '')}>No end time</Button>}
            </div>
            <span className="hint">Drives the countdown (from the server's clock). Without it there is no countdown.</span>
          </div>

          <div className="field full">
            <label>Custom image (optional)</label>
            <div className="hstack" style={{ gap: 12 }}>
              {form.imageUrl && <img src={form.imageUrl} alt="" style={{ height: 56, borderRadius: 8 }} />}
              <label className="btn" style={{ cursor: 'pointer' }}>
                {form.imageUrl ? 'Replace image' : 'Upload image'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f) }} />
              </label>
              {form.imageUrl && <Button size="sm" onClick={() => set('imageUrl', '')}>Remove</Button>}
            </div>
          </div>

          {[
            ['lockApp', 'Lock the app for everyone', 'Existing users see the maintenance screen at once and every request is refused by the server. Off: the app stays usable and just shows a notice.'],
            ['blockLogins', 'Block new sign-ins and sign-ups', 'Applies even when the app itself stays open.'],
            ['lockPanel', 'Also lock panel staff', 'Master, Global, Country, Sub and Agency accounts see the maintenance screen too. You (Super Admin) are never locked out.'],
            ['autoEnd', 'End automatically at the end time', 'Off (recommended): maintenance stays on until you end it, however long the work takes.'],
          ].map(([k, title, desc]) => (
            <div className="field full" key={k}>
              <div className="toggle-row" style={{ padding: 0, border: 0 }}>
                <div><div className="t-title">{title}</div><div className="t-desc">{desc}</div></div>
                <label className="toggle">
                  <input type="checkbox" checked={!!form[k]} onChange={(e) => set(k, e.target.checked)} aria-label={title} />
                  <span className="track" /><span className="thumb" />
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="hstack" style={{ gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <Button icon="eye" onClick={() => setDialog('preview')}>Preview</Button>
          <Button variant="danger" icon="lock" disabled={busy || !form.title.trim() || !form.message.trim()}
            onClick={() => (startsInFuture ? enable() : setDialog('enable'))}>
            {active ? 'Update maintenance' : startsInFuture ? 'Schedule maintenance' : 'Enable maintenance'}
          </Button>
        </div>
      </Card>

      {/* ---------------------------------------------------------------- sessions */}
      <Card title="Session control" sub="Signs people out everywhere. Their sessions end, so they can't refresh; open apps sign out at once." className="mb-16">
        <div className="hstack" style={{ gap: 12, flexWrap: 'wrap' }}>
          <Button icon="logout" disabled={busy} onClick={() => setDialog('users')}>Logout all app users</Button>
          <Button icon="logout" disabled={busy} onClick={() => setDialog('admins')}>Logout all admins</Button>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>"Logout all admins" keeps <i>your</i> session so you can't lock yourself out.</p>
      </Card>

      {/* ---------------------------------------------------------------- emergency */}
      <Card title="Emergency" className="mb-16">
        <div style={{ border: '1px solid #dc262655', borderRadius: 10, padding: 14, background: '#dc26260d' }}>
          <b>🚨 Emergency lockdown</b>
          <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 12px' }}>
            Immediately: locks the app, signs every app user out, blocks sign-in, and locks all panel staff. No timer. Only you stay in; end it from this page.
          </p>
          <Button variant="danger" icon="lock" disabled={busy || state === 'lockdown'} onClick={() => setDialog('lockdown')}>
            {state === 'lockdown' ? 'Lockdown is on' : 'Emergency lockdown'}
          </Button>
        </div>
      </Card>

      {/* ---------------------------------------------------------------- dialogs */}
      {dialog === 'preview' && (
        <Modal title="Preview — what users see" onClose={() => setDialog(null)} footer={<Button onClick={() => setDialog(null)}>Close</Button>}>
          <div style={{ background: 'var(--bg, #f6f7fb)', borderRadius: 12, padding: 12 }}>
            <MaintenanceCard status={previewStatus} serverNow={() => Date.now()} compact />
          </div>
        </Modal>
      )}
      {dialog === 'enable' && (
        <ConfirmDialog title="Turn maintenance on now?" danger busy={busy} confirmLabel="Enable maintenance"
          message={`${form.lockApp ? 'Every app user' : 'The app'} ${form.lockApp ? 'will be locked out right away' : 'will show a maintenance notice'}${form.lockPanel ? ', and panel staff too' : ''}. You stay in. You can end it from this page at any time.`}
          onConfirm={enable} onClose={() => setDialog(null)} />
      )}
      {dialog === 'users' && (
        <ConfirmDialog title="Log out all app users?" danger busy={busy} confirmLabel="Log everyone out"
          message="Every signed-in app user is signed out on every device and has to sign in again. Panel accounts are not affected."
          onConfirm={() => run(async () => { const n = await logoutAllAppUsers(); toast(`${n} sessions ended`) }, 'All app users logged out')}
          onClose={() => setDialog(null)} />
      )}
      {dialog === 'admins' && (
        <TypedConfirm title="Log out all admins?" phrase="LOGOUT ADMINS" busy={busy}
          message="Every panel account — Master, Global, Country, Sub, Agency and other Super Admin sessions — is signed out. Your own session stays."
          onConfirm={() => run(async () => { const n = await logoutAllAdmins(); toast(`${n} sessions ended`) }, 'All other admins logged out')}
          onClose={() => setDialog(null)} />
      )}
      {dialog === 'lockdown' && (
        <TypedConfirm title="Emergency lockdown" phrase="LOCKDOWN" busy={busy} confirmLabel="Lock everything"
          message="This locks the app and the panel for everyone but you, and signs out every app user. Use it for an urgent problem."
          extra={<div className="field"><label>Message shown to people (optional)</label><textarea className="textarea" value={lockMessage} onChange={(e) => setLockMessage(e.target.value)} placeholder="We've paused Saba Live while we deal with an urgent issue…" /></div>}
          onConfirm={() => run(() => emergencyLockdown(lockMessage), 'Lockdown is ON')}
          onClose={() => setDialog(null)} />
      )}
    </>
  )
}

/* A confirmation that makes you type a phrase first. */
function TypedConfirm({ title, message, phrase, onConfirm, onClose, busy, confirmLabel = 'Confirm', extra }) {
  const [typed, setTyped] = useState('')
  const ok = typed.trim() === phrase
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" icon={busy ? 'refresh' : 'lock'} disabled={!ok || busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</Button>
      </>}>
      <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 14 }}>{message}</p>
      {extra}
      <div className="field">
        <label>Type <b>{phrase}</b> to confirm</label>
        <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
      </div>
    </Modal>
  )
}
