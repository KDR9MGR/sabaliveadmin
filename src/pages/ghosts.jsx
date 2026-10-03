import { useState } from 'react'
import { PageHeader, Card, Button, Modal, ConfirmDialog, PillTabs, Tag, useToast } from '../components/ui.jsx'
import { statusCol } from '../components/cells.jsx'
import DataTable from '../components/DataTable.jsx'
import EntityForm from '../components/EntityForm.jsx'
import Icon from '../components/Icon.jsx'
import { AsyncView } from './_templates.jsx'
import { useAsyncData } from '../lib/useAsync.js'
import {
  listGhosts, createGhost, resetGhostPassword, setGhostActive, deleteGhost, updateGhost, listWatchLog,
} from '../lib/ghosts.js'

/* Super Admin → Monitoring → Ghost IDs.
   A ghost ID is an account that signs in to the Sabalive app like anyone else and
   can sit in any live room — but nobody can find it (it is hidden from search,
   profiles, follower lists and every viewer list), the room is never told it
   arrived, and it can only watch (no chat, gifts, likes, follows or seats). */

function Credentials({ result, title, onClose }) {
  const toast = useToast()
  const copy = (text) => navigator.clipboard?.writeText(text).then(() => toast('Copied'), () => toast('Copy failed'))
  return (
    <Modal title={title} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
      <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
        Sign in on the Sabalive app with <b>Email</b> and this password. {result.temp_password
          ? 'The password is shown only now — copy it before closing.'
          : 'It uses the password you entered.'}
      </p>
      <dl className="kv">
        {result.email && (<>
          <dt>Email</dt>
          <dd className="hstack spread"><span className="mono">{result.email}</span><Button size="sm" onClick={() => copy(result.email)}>Copy</Button></dd>
        </>)}
        {result.temp_password && (<>
          <dt>Password</dt>
          <dd className="hstack spread"><span className="mono">{result.temp_password}</span><Button size="sm" onClick={() => copy(result.temp_password)}>Copy</Button></dd>
        </>)}
      </dl>
    </Modal>
  )
}

function GhostTable() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listGhosts)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind: 'reset' | 'toggle' | 'delete', row }
  const [busy, setBusy] = useState(false)
  const [creds, setCreds] = useState(null) // { title, result }

  const run = async (fn, okMsg) => {
    setBusy(true)
    try { await fn(); toast(okMsg); setConfirm(null); reload() }
    catch (e) { toast(e.message || 'That did not work') }
    finally { setBusy(false) }
  }

  const doConfirm = () => {
    const { kind, row } = confirm
    if (kind === 'reset') {
      return (async () => {
        setBusy(true)
        try {
          const result = await resetGhostPassword(row.id)
          setConfirm(null)
          setCreds({ title: `New password · ${row.label}`, result: { email: row.email === '—' ? '' : row.email, ...result } })
        } catch (e) { toast(e.message || 'Could not reset the password') } finally { setBusy(false) }
      })()
    }
    if (kind === 'toggle') return run(() => setGhostActive(row.id, !row.active), row.active ? 'Ghost disabled' : 'Ghost enabled')
    return run(() => deleteGhost(row.id), 'Ghost deleted')
  }

  const confirmCopy = confirm && {
    reset: { title: 'Reset this ghost’s password?', label: 'Reset password', danger: false,
      message: `${confirm.row.label} will be signed out of nothing, but its old password stops working. A new one is shown once.` },
    toggle: confirm.row.active
      ? { title: 'Disable this ghost?', label: 'Disable', danger: true,
        message: `${confirm.row.label} can no longer sign in or get a streaming token. You can enable it again later.` }
      : { title: 'Enable this ghost?', label: 'Enable', danger: false, message: `${confirm.row.label} will be able to sign in again.` },
    delete: { title: 'Delete this ghost?', label: 'Delete', danger: true,
      message: `${confirm.row.label} and its sign-in are removed for good. Its entries in the watch log are removed too.` },
  }[confirm.kind]

  return (
    <AsyncView loading={loading} error={error} reload={reload}>
      <DataTable
        rows={rows || []}
        searchKeys={['label', 'email', 'notes']}
        toolbarRight={<Button variant="primary" icon="plus" onClick={() => setCreating(true)}>Create ghost ID</Button>}
        columns={[
          { key: 'label', header: 'Ghost', sortable: true, render: (r) => (
            <div><div style={{ fontWeight: 600 }}>{r.label}</div>{r.notes && <div className="muted" style={{ fontSize: 12 }}>{r.notes}</div>}</div>
          ) },
          { key: 'email', header: 'Sign-in email', render: (r) => <span className="mono muted">{r.email}</span> },
          statusCol(),
          { key: 'lastWatched', header: 'Last watched' },
          { key: 'created', header: 'Created', sortable: true, render: (r) => <span>{r.created}{r.createdBy !== '—' && <span className="muted"> · {r.createdBy}</span>}</span> },
        ]}
        rowActions={(r) => [
          { label: 'Edit label / notes', icon: 'edit', onClick: () => setEditing(r) },
          { label: 'Reset password', icon: 'key', onClick: () => setConfirm({ kind: 'reset', row: r }) },
          { label: r.active ? 'Disable' : 'Enable', icon: r.active ? 'lock' : 'check', onClick: () => setConfirm({ kind: 'toggle', row: r }) },
          { sep: true },
          { label: 'Delete', icon: 'trash', onClick: () => setConfirm({ kind: 'delete', row: r }) },
        ]}
        emptyText="No ghost IDs yet. Create one to start monitoring lives from the app."
      />
      {creating && (
        <EntityForm
          title="Create ghost ID"
          submitLabel="Create"
          savedMessage="Ghost created"
          fields={[
            { name: 'label', label: 'Label', required: true, full: true, hint: 'Only you see this — e.g. “Mumbai monitor 1”.' },
            { name: 'notes', label: 'Notes', type: 'textarea', full: true },
            { name: 'email', label: 'Sign-in email (optional)', type: 'email', full: true, hint: 'Left blank, a throwaway address is generated.' },
            { name: 'password', label: 'Password (optional)', full: true, hint: 'Left blank, a strong one is generated and shown once. 8+ characters.' },
          ]}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            const result = await createGhost(v)
            setCreds({ title: 'Ghost ID created', result })
            reload()
          }}
        />
      )}
      {editing && (
        <EntityForm
          title={`Edit ${editing.label}`}
          initial={{ label: editing.label, notes: editing.notes }}
          fields={[
            { name: 'label', label: 'Label', required: true, full: true },
            { name: 'notes', label: 'Notes', type: 'textarea', full: true },
          ]}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => { await updateGhost(editing.id, v); reload() }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirmCopy.title}
          message={confirmCopy.message}
          confirmLabel={confirmCopy.label}
          danger={confirmCopy.danger}
          busy={busy}
          onConfirm={doConfirm}
          onClose={() => setConfirm(null)}
        />
      )}
      {creds && <Credentials title={creds.title} result={creds.result} onClose={() => setCreds(null)} />}
    </AsyncView>
  )
}

function WatchLog() {
  const { data: rows, loading, error, reload } = useAsyncData(listWatchLog)
  return (
    <AsyncView loading={loading} error={error} reload={reload}>
      <DataTable
        rows={rows || []}
        searchKeys={['watcher', 'host', 'stream']}
        toolbarRight={<Button icon="refresh" onClick={reload}>Refresh</Button>}
        filters={[{ label: 'Via', options: ['Ghost ID', 'Panel'], get: (r) => r.via }]}
        columns={[
          { key: 'watcher', header: 'Watcher', sortable: true },
          { key: 'via', header: 'Via', render: (r) => <Tag>{r.via}</Tag> },
          { key: 'host', header: 'Host', sortable: true },
          { key: 'stream', header: 'Live' },
          { key: 'when', header: 'Started' },
        ]}
        emptyText="Nobody has watched a live as a ghost yet."
      />
    </AsyncView>
  )
}

export function GhostIds() {
  const [view, setView] = useState('Ghost IDs')
  return (
    <>
      <PageHeader
        title="Ghost IDs"
        crumbs={['Home', 'Monitoring', 'Ghost IDs']}
        actions={<PillTabs tabs={['Ghost IDs', 'Watch log']} value={view} onChange={setView} />}
      />
      <Card>
        <div className="card__body hstack" style={{ gap: 10, fontSize: 13 }}>
          <Icon name="eye" size={18} />
          <span className="muted">
            A ghost ID signs in to the app and joins any live room without anyone knowing: it never appears
            in a viewer list, the host and room aren’t notified, and nobody can find the account. It can
            only watch — it can’t chat, gift, like, follow or take a seat. For monitoring only.
          </span>
        </div>
      </Card>
      <div style={{ height: 16 }} />
      {view === 'Ghost IDs' ? <GhostTable /> : <WatchLog />}
    </>
  )
}
