import { useState } from 'react'
import { AsyncView, StatGrid } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, PillTabs, Modal, ConfirmDialog, useToast } from '../../components/ui.jsx'
import { statusCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import Icon from '../../components/Icon.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import {
  listHostCodes, listHostGrants, generateCode, setCodeStatus, setGrantStatus,
} from '../../lib/hostCodes.js'
import { fmtDate } from '../../lib/admin.js'

const CRUMBS = ['Home', 'Host Management']

function copy(text, toast) {
  navigator.clipboard?.writeText(text)
  toast('Copied to clipboard')
}

/* datetime-local string (local tz) for `now + days` */
function plusDaysLocal(days) {
  const d = new Date(Date.now() + days * 864e5)
  d.setSeconds(0, 0)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/* ------------------------------------------------------------------ Generate modal */
function GenerateCodeModal({ scopedName, onClose, onDone }) {
  const toast = useToast()
  const [label, setLabel] = useState('')
  const [expiresAt, setExpiresAt] = useState(() => plusDaysLocal(30))
  const [maxUses, setMaxUses] = useState('1')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const submit = async () => {
    setError('')
    if (!expiresAt) { setError('Pick an expiry date'); return }
    const iso = new Date(expiresAt).toISOString()
    if (new Date(iso).getTime() <= Date.now()) { setError('Expiry must be in the future'); return }
    const uses = Number(maxUses)
    if (!Number.isFinite(uses) || uses < 1 || uses > 500) { setError('Max uses must be between 1 and 500'); return }
    setBusy(true)
    try {
      const row = await generateCode({ expiresAt: iso, label, maxUses: uses })
      setResult(row)
      onDone?.()
    } catch (e) {
      setError(e?.message || 'Could not generate the code')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <Modal title="Host code generated" onClose={onClose}
        footer={<Button variant="primary" icon="check" onClick={onClose}>Done</Button>}>
        <p className="muted" style={{ fontSize: 13 }}>
          Give this to the host. It works until <b>{fmtDate(result.expires_at)}</b>, for up to <b>{result.max_uses}</b> redemption{result.max_uses > 1 ? 's' : ''}.
        </p>
        <div className="hstack" style={{ gap: 12, marginTop: 14, alignItems: 'center' }}>
          <code style={{ fontSize: 26, fontWeight: 800, letterSpacing: '0.14em', background: 'var(--surface-2)', padding: '12px 20px', borderRadius: 12 }}>
            {result.code}
          </code>
          <Button icon="idCard" onClick={() => copy(result.code, toast)}>Copy</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Generate host code" onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="primary" icon={busy ? 'refresh' : 'plus'} disabled={busy} onClick={submit}>
          {busy ? 'Generating…' : 'Generate'}
        </Button>
      </>}>
      {scopedName && (
        <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
          This code will be tied to <b>{scopedName}</b>.
        </p>
      )}
      <div className="form-grid">
        <div className="field full">
          <label>Label</label>
          <input className="input" placeholder="e.g. October creators batch"
            value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="field">
          <label>Expires <span className="req">*</span></label>
          <input className="input" type="datetime-local" value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <div className="field">
          <label>Max uses</label>
          <input className="input" type="number" min="1" max="500" value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)} />
        </div>
      </div>
      {error && (
        <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginTop: 12 }}>{error}</div>
      )}
    </Modal>
  )
}

/* ------------------------------------------------------------------ Ban-grant modal (needs a reason) */
function BanGrantModal({ grant, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const go = async () => {
    setBusy(true); setError('')
    try { await onConfirm(reason); onClose() }
    catch (e) { setError(e?.message || 'Could not ban this grant'); setBusy(false) }
  }
  return (
    <Modal title={`Ban ${grant.name}'s host access`} onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" icon={busy ? 'refresh' : 'lock'} disabled={busy} onClick={go}>
          {busy ? 'Banning…' : 'Ban access'}
        </Button>
      </>}>
      <p className="muted" style={{ fontSize: 13 }}>
        They lose the ability to go live immediately. A ban stays until you re-activate it.
      </p>
      <div className="field" style={{ marginTop: 12 }}>
        <label>Reason</label>
        <textarea className="textarea" placeholder="Shown in the grants list" value={reason}
          onChange={(e) => setReason(e.target.value)} />
      </div>
      {error && (
        <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginTop: 10 }}>{error}</div>
      )}
    </Modal>
  )
}

/* ------------------------------------------------------------------ Codes table */
function CodesTable({ agencyId, scopedName }) {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(() => listHostCodes(agencyId), [agencyId])
  const [generating, setGenerating] = useState(false)
  const [confirm, setConfirm] = useState(null) // { row, next }

  const list = rows || []
  const soon = Date.now() + 7 * 864e5
  const stats = [
    { key: 'Active codes', value: list.filter((r) => r.status === 'Active').length, icon: 'idCard', tile: 'tile-green' },
    { key: 'Expiring in 7 days', value: list.filter((r) => r.statusRaw === 'active' && !r.expired && new Date(r.expiresAt).getTime() <= soon).length, icon: 'clock', tile: 'tile-orange' },
    { key: 'Banned', value: list.filter((r) => r.statusRaw === 'banned').length, icon: 'lock', tile: 'tile-red' },
  ]

  const applyStatus = async () => {
    try {
      await setCodeStatus(confirm.row.id, confirm.next)
      toast(confirm.next === 'banned' ? `${confirm.row.code} banned` : `${confirm.row.code} re-activated`)
      setConfirm(null)
      reload()
    } catch (e) {
      toast(e?.message || 'Could not update the code')
    }
  }

  return (
    <>
      <div className="hstack spread wrap" style={{ gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 260 }}><StatGrid stats={stats} /></div>
        <Button variant="primary" icon="plus" onClick={() => setGenerating(true)}>Generate code</Button>
      </div>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={list}
          searchKeys={['code', 'label', 'agency', 'createdBy']}
          tabs={[
            { label: 'Active', value: 'a', filter: (r) => r.status === 'Active' },
            { label: 'Banned', value: 'b', filter: (r) => r.statusRaw === 'banned' },
            { label: 'Expired', value: 'e', filter: (r) => r.status === 'Expired' },
            { label: 'All', value: 'all', filter: () => true },
          ]}
          columns={[
            { key: 'code', header: 'Code', sortable: true, render: (r) => (
              <span className="hstack" style={{ gap: 8 }}>
                <code style={{ fontWeight: 700, letterSpacing: '0.08em' }}>{r.code}</code>
                <button className="icon-btn" title="Copy" onClick={() => copy(r.code, toast)}>
                  <Icon name="idCard" size={14} />
                </button>
              </span>
            ) },
            { key: 'label', header: 'Label' },
            { key: 'agency', header: 'Agency', render: (r) => <Tag>{r.agency}</Tag> },
            { key: 'usage', header: 'Uses', align: 'right', render: (r) => (
              <span className="mono" style={{ color: r.exhausted ? 'var(--danger)' : undefined }}>{r.usage}</span>
            ) },
            { key: 'expiresRel', header: 'Expires', sortable: true, render: (r) => (
              <span style={{ color: r.expired ? 'var(--danger)' : undefined }} title={r.expiresAbs}>{r.expiresRel}</span>
            ) },
            statusCol(),
            { key: 'createdBy', header: 'Created by' },
            { key: 'created', header: 'Created', sortable: true },
          ]}
          rowActions={(r) => [
            { label: 'Copy code', icon: 'idCard', onClick: () => copy(r.code, toast) },
            r.statusRaw === 'banned'
              ? { label: 'Un-ban', icon: 'check', onClick: () => setConfirm({ row: r, next: 'active' }) }
              : { label: 'Ban code', icon: 'lock', onClick: () => setConfirm({ row: r, next: 'banned' }) },
          ]}
          emptyText="No host codes yet — generate one to let a host go live."
        />
      </AsyncView>

      {generating && (
        <GenerateCodeModal scopedName={scopedName} onClose={() => setGenerating(false)} onDone={reload} />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.next === 'banned' ? 'Ban this code?' : 'Re-activate this code?'}
          danger={confirm.next === 'banned'}
          confirmLabel={confirm.next === 'banned' ? 'Ban code' : 'Re-activate'}
          message={confirm.next === 'banned'
            ? `${confirm.row.code} stops working and every active grant issued from it is banned too.`
            : `${confirm.row.code} can be redeemed again (subject to its expiry and use limit).`}
          onConfirm={applyStatus}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Grants table */
function GrantsTable({ agencyId }) {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(() => listHostGrants(agencyId), [agencyId])
  const [confirm, setConfirm] = useState(null) // { row, next }
  const [banning, setBanning] = useState(null) // row

  const apply = async (row, next, reason) => {
    await setGrantStatus(row.id, next, reason)
    toast(next === 'active' ? `${row.name} re-activated` : `${row.name} ${next}`)
    reload()
  }

  return (
    <>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['name', 'username', 'code', 'agency']}
          tabs={[
            { label: 'Active', value: 'a', filter: (r) => r.statusRaw === 'active' && !r.expired },
            { label: 'Revoked', value: 'r', filter: (r) => r.statusRaw === 'revoked' },
            { label: 'Banned', value: 'b', filter: (r) => r.statusRaw === 'banned' },
            { label: 'All', value: 'all', filter: () => true },
          ]}
          columns={[
            { key: 'name', header: 'Host', sortable: true, render: (r) => <Person name={r.name} meta={r.username ? `@${r.username}` : undefined} size="sm" /> },
            { key: 'code', header: 'Code used', render: (r) => <code>{r.code}</code> },
            { key: 'agency', header: 'Agency', render: (r) => <Tag>{r.agency}</Tag> },
            { key: 'grantedAt', header: 'Granted', sortable: true },
            { key: 'expiresRel', header: 'Expires', sortable: true, render: (r) => (
              <span style={{ color: r.expired ? 'var(--danger)' : undefined }} title={r.expiresAbs}>{r.expiresRel}</span>
            ) },
            statusCol(),
            { key: 'banReason', header: 'Note', render: (r) => r.banReason ? <span className="muted" style={{ fontSize: 12 }}>{r.banReason}</span> : <span className="muted">—</span> },
          ]}
          rowActions={(r) => {
            const items = []
            if (r.statusRaw === 'active') {
              items.push({ label: 'Revoke', icon: 'x', onClick: () => setConfirm({ row: r, next: 'revoked' }) })
              items.push({ label: 'Ban', icon: 'lock', onClick: () => setBanning(r) })
            } else {
              items.push({ label: 'Re-activate', icon: 'check', onClick: () => setConfirm({ row: r, next: 'active' }) })
            }
            return items
          }}
          emptyText="No host access granted yet."
        />
      </AsyncView>

      {confirm && (
        <ConfirmDialog
          title={confirm.next === 'active' ? 'Re-activate host access?' : 'Revoke host access?'}
          danger={confirm.next === 'revoked'}
          confirmLabel={confirm.next === 'active' ? 'Re-activate' : 'Revoke'}
          message={confirm.next === 'active'
            ? `${confirm.row.name} can go live again (until ${confirm.row.expiresAbs}).`
            : `${confirm.row.name} can no longer go live. You can re-activate this later.`}
          onConfirm={async () => {
            try { await apply(confirm.row, confirm.next); setConfirm(null) }
            catch (e) { toast(e?.message || 'Could not update this grant') }
          }}
          onClose={() => setConfirm(null)}
        />
      )}
      {banning && (
        <BanGrantModal
          grant={banning}
          onClose={() => setBanning(null)}
          onConfirm={(reason) => apply(banning, 'banned', reason)}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ shared shell */
export function HostCodesShell({ agencyId, scopedName }) {
  const [view, setView] = useState('Codes')
  return (
    <>
      <PillTabs tabs={['Codes', 'Host Access']} value={view} onChange={setView} />
      <div style={{ marginTop: 16 }}>
        {view === 'Codes'
          ? <CodesTable agencyId={agencyId} scopedName={scopedName} />
          : <GrantsTable agencyId={agencyId} />}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Master page */
export function HostCodes() {
  return (
    <>
      <PageHeader title="Host Codes" crumbs={[...CRUMBS, 'Host Codes']} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        Going live in the app needs an agency-issued code. A host redeems one for a time-limited grant; ban a code
        (and its grants) or a single host's access from here.
      </div></Card>
      <HostCodesShell />
    </>
  )
}
