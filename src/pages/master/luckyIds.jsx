import { useState } from 'react'
import { PageHeader, Card, Button, Modal, ConfirmDialog, useToast } from '../../components/ui.jsx'
import { statusCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import UserPicker from '../../components/UserPicker.jsx'
import Icon from '../../components/Icon.jsx'
import { AsyncView } from '../_templates.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listLuckyIds, saveLuckyId, deleteLuckyId, assignLuckyId, revokeLuckyId } from '../../lib/luckyIds.js'
import { sellerUserOptions } from '../../lib/coinSellers.js'

/* Master → Store → Lucky ID. Special app ID numbers users can buy in the Store, or
   that you assign. Owning one replaces the user's app ID until it expires. */
export function LuckyIds() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listLuckyIds)
  const [editing, setEditing] = useState(null) // row or {}
  const [assigning, setAssigning] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind, row }
  const [busy, setBusy] = useState(false)

  const run = async (fn, ok) => {
    setBusy(true)
    try { await fn(); toast(ok); setConfirm(null); reload() }
    catch (e) { toast(e.message || 'That did not work') }
    finally { setBusy(false) }
  }

  const fields = [
    { name: 'number', label: 'ID number', type: 'text', required: true, placeholder: '888888 or 0786', hint: 'At least 4 digits, e.g. 888888. A leading zero is kept (0786). Must not already be someone\'s app ID.' },
    { name: 'price', label: 'Price (coins)', type: 'number', required: true, hint: '0 makes it free to claim.' },
    { name: 'days', label: 'Days a purchase lasts', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'active', label: 'For sale' }, { value: 'inactive', label: 'Hidden' }] },
  ]

  return (
    <>
      <PageHeader
        title="Lucky ID"
        crumbs={['Home', 'Monetisation', 'Store', 'Lucky ID']}
        actions={<Button variant="primary" icon="plus" onClick={() => setEditing({ price: 0, days: 30, rawStatus: 'active' })}>Add number</Button>}
      />
      <Card>
        <div className="card__body hstack" style={{ gap: 10, fontSize: 13 }}>
          <Icon name="star" size={18} />
          <span className="muted">
            Special ID numbers for the Store → Lucky ID tab. While a user owns one it replaces their app ID everywhere it is shown or
            searched; when it expires (or you revoke it) their own ID comes back. A user holds one at a time, and a number belongs to one person.
          </span>
        </div>
      </Card>
      <div style={{ height: 16 }} />
      <AsyncView loading={loading && !rows} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['number', 'owner']}
          tabs={[
            { label: 'All', value: 'all', filter: () => true },
            { label: 'Available', value: 'a', filter: (r) => r.state === 'Available' },
            { label: 'Taken', value: 't', filter: (r) => r.state === 'Taken' },
            { label: 'Hidden', value: 'h', filter: (r) => r.state === 'Inactive' },
          ]}
          columns={[
            { key: 'number', header: 'ID', sortable: true, render: (r) => <b className="mono">{r.number}</b> },
            { key: 'price', header: 'Price', sortable: true, render: (r) => (r.price ? `🪙 ${r.price.toLocaleString()}` : 'Free') },
            { key: 'days', header: 'Days', sortable: true },
            { key: 'state', header: 'State', render: (r) => <span className={`badge badge--${r.state === 'Available' ? 'success' : r.state === 'Taken' ? 'warning' : 'muted'}`}>{r.state}</span> },
            { key: 'owner', header: 'Owner', render: (r) => r.owner || <span className="muted">—</span> },
            { key: 'expires', header: 'Expires', render: (r) => r.expires || <span className="muted">—</span> },
          ]}
          rowActions={(r) => [
            { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) },
            ...(r.taken
              ? [{ label: 'Revoke from owner', icon: 'x', onClick: () => setConfirm({ kind: 'revoke', row: r }) }]
              : [{ label: 'Assign to a user', icon: 'userPlus', onClick: () => setAssigning(r) }]),
            ...(!r.taken ? [{ sep: true }, { label: 'Delete', icon: 'trash', onClick: () => setConfirm({ kind: 'delete', row: r }) }] : []),
          ]}
          emptyText="No Lucky IDs yet. Add a number and it appears in the app's Store."
        />
      </AsyncView>
      {editing && (
        <EntityForm
          title={editing.id ? `Edit ${editing.number}` : 'Add a Lucky ID'}
          initial={{ number: editing.number ?? '', price: editing.price ?? 0, days: editing.days ?? 30, status: editing.rawStatus || 'active' }}
          fields={fields}
          onClose={() => setEditing(null)}
          savedMessage="Saved"
          onSubmit={async (v) => { await saveLuckyId({ id: editing.id, ...v }); reload() }}
        />
      )}
      {assigning && <AssignDialog lucky={assigning} onClose={() => setAssigning(null)} onDone={() => { setAssigning(null); reload() }} />}
      {confirm && (
        <ConfirmDialog
          danger busy={busy}
          title={confirm.kind === 'revoke' ? 'Revoke this Lucky ID?' : 'Delete this Lucky ID?'}
          message={confirm.kind === 'revoke'
            ? `${confirm.row.owner} gets their own app ID back and ${confirm.row.number} returns to the pool.`
            : `${confirm.row.number} is removed from the catalog.`}
          confirmLabel={confirm.kind === 'revoke' ? 'Revoke' : 'Delete'}
          onConfirm={() => run(() => (confirm.kind === 'revoke' ? revokeLuckyId(confirm.row.id) : deleteLuckyId(confirm.row.id)),
            confirm.kind === 'revoke' ? 'Revoked' : 'Deleted')}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  )
}

function AssignDialog({ lucky, onClose, onDone }) {
  const toast = useToast()
  const { data: users } = useAsyncData(sellerUserOptions)
  const [user, setUser] = useState('')
  const [days, setDays] = useState(String(lucky.days))
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    try { await assignLuckyId(lucky.id, user, days); toast(`${lucky.number} assigned`); onDone() }
    catch (e) { toast(e.message || 'Could not assign'); setBusy(false) }
  }
  return (
    <Modal title={`Assign ${lucky.number}`} onClose={onClose} footer={<>
      <Button onClick={onClose} disabled={busy}>Cancel</Button>
      <Button variant="primary" disabled={!user || busy} onClick={go}>{busy ? 'Assigning…' : 'Assign'}</Button>
    </>}>
      <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Free of charge. It becomes the user's app ID until it expires.</p>
      <div className="field full"><label>User</label><UserPicker options={users || []} value={user} onChange={setUser} /></div>
      <div className="field" style={{ marginTop: 12 }}><label>Days</label>
        <input className="input" type="number" value={days} onChange={(e) => setDays(e.target.value)} /></div>
    </Modal>
  )
}
