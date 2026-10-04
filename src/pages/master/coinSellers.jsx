import { useState } from 'react'
import { PageHeader, Card, Button, Drawer, Person, Tag, ConfirmDialog, useToast } from '../../components/ui.jsx'
import { statusCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import UserPicker from '../../components/UserPicker.jsx'
import Icon from '../../components/Icon.jsx'
import { AsyncView } from '../_templates.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listSellers, saveSeller, setSellerActive, deleteSeller, sellerUserOptions, waLink } from '../../lib/coinSellers.js'

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.15L2 22l4.98-1.6A9.93 9.93 0 1 0 12.04 2Zm5.8 14.05c-.25.7-1.45 1.33-2 1.4-.52.07-1.17.1-1.88-.12a17 17 0 0 1-1.7-.63c-3-1.3-4.95-4.3-5.1-4.5-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.45.27-.3.6-.37.8-.37h.58c.18 0 .43-.07.67.52.25.6.85 2.06.92 2.2.08.15.12.33.02.52-.1.2-.15.32-.3.5l-.45.52c-.15.15-.3.31-.13.6.18.3.77 1.27 1.65 2.05 1.13 1 2.08 1.3 2.38 1.46.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.82 2.02.97.3.15.5.22.57.35.07.12.07.72-.18 1.42Z" />
    </svg>
  )
}

/* Master → Coin & Gift → Coin Sellers. What users see under Wallet → Coin Sellers. */
export function CoinSellers() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listSellers)
  const [form, setForm] = useState(null) // a row, or {}
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn, ok) => {
    setBusy(true)
    try { await fn(); toast(ok); setConfirm(null); reload() }
    catch (e) { toast(e.message || 'That did not work') }
    finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader
        title="Coin Sellers"
        crumbs={['Home', 'Monetisation', 'Coin Sellers']}
        actions={<Button variant="primary" icon="plus" onClick={() => setForm({})}>Add seller</Button>}
      />
      <Card>
        <div className="card__body hstack" style={{ gap: 10, fontSize: 13 }}>
          <Icon name="coins" size={18} />
          <span className="muted">
            People who sell coins for cash / UPI outside the app. Users see active sellers in the app (Wallet → Coin
            Sellers) with their profile and a WhatsApp button. Link a seller to an app user to show their photo, app ID and level.
          </span>
        </div>
      </Card>
      <div style={{ height: 16 }} />
      <AsyncView loading={loading && !rows} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['name', 'userName', 'username', 'displayId', 'whatsapp', 'note']}
          columns={[
            { key: 'name', header: 'Seller', sortable: true, render: (r) => (
              <Person name={r.name} size="sm" src={r.avatar} meta={r.username ? `@${r.username}` : 'Not linked to a user'} />
            ) },
            { key: 'displayId', header: 'App ID', render: (r) => (r.displayId ? <span className="mono muted">{r.displayId}</span> : <span className="muted">—</span>) },
            { key: 'level', header: 'Level', render: (r) => (r.level ? <Tag>Lv. {r.level}</Tag> : <span className="muted">—</span>) },
            { key: 'whatsapp', header: 'WhatsApp', render: (r) => (
              <a className="hstack" style={{ gap: 6 }} href={waLink(r.whatsapp)} target="_blank" rel="noreferrer">
                <WhatsAppIcon /> <span className="mono">{r.whatsapp}</span>
              </a>
            ) },
            { key: 'note', header: 'Note', render: (r) => r.note || <span className="muted">—</span> },
            { key: 'sort', header: 'Order', sortable: true },
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Edit', icon: 'edit', onClick: () => setForm(r) },
            { label: r.active ? 'Hide from app' : 'Show in app', icon: r.active ? 'lock' : 'check', onClick: () => run(() => setSellerActive(r.id, !r.active), r.active ? 'Hidden from the app' : 'Shown in the app') },
            { sep: true },
            { label: 'Delete', icon: 'trash', onClick: () => setConfirm(r) },
          ]}
          emptyText="No coin sellers yet. Add one and it shows in the app straight away."
        />
      </AsyncView>
      {form && <SellerForm seller={form} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />}
      {confirm && (
        <ConfirmDialog
          danger busy={busy} title="Delete this seller?" confirmLabel="Delete"
          message={`${confirm.name} is removed from the app's Coin Sellers list.`}
          onConfirm={() => run(() => deleteSeller(confirm.id), 'Seller deleted')}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  )
}

function SellerForm({ seller, onClose, onSaved }) {
  const toast = useToast()
  const { data: users } = useAsyncData(sellerUserOptions)
  const [v, setV] = useState({
    id: seller.id, profile_id: seller.profileId || '', name: seller.name || '', whatsapp_number: seller.whatsapp || '',
    note: seller.note || '', active: seller.active ?? true, sort_order: seller.sort ?? 0,
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }))

  const pick = (id) => {
    const u = (users || []).find((o) => o.value === id)
    setV((s) => ({ ...s, profile_id: id, name: s.name || u?.name || '', whatsapp_number: s.whatsapp_number || u?.phone || '' }))
  }
  const submit = async () => {
    setBusy(true); setErr('')
    try { await saveSeller(v); toast('Seller saved'); onSaved() }
    catch (e) { setErr(e.message || 'Could not save') }
    finally { setBusy(false) }
  }

  return (
    <Drawer
      title={seller.id ? `Edit ${seller.name}` : 'Add coin seller'}
      onClose={onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="primary" icon={busy ? 'refresh' : 'check'} onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
      </>}
    >
      {err && <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{err}</div>}
      <div className="form-grid">
        <div className="field full">
          <label>Linked app user</label>
          <UserPicker options={users || []} value={v.profile_id} onChange={pick} />
          <span className="hint">Optional. Shows their photo, name, app ID and level in the app.{v.profile_id && <> <a href="#clear" onClick={(e) => { e.preventDefault(); set('profile_id', '') }}>Unlink</a></>}</span>
        </div>
        <div className="field full"><label>Name <span className="req">*</span></label>
          <input className="input" value={v.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="field full"><label>WhatsApp number <span className="req">*</span></label>
          <input className="input" placeholder="+91 98765 43210" value={v.whatsapp_number} onChange={(e) => set('whatsapp_number', e.target.value)} />
          <span className="hint">With country code. The app opens this number in WhatsApp.</span></div>
        <div className="field full"><label>Note</label>
          <textarea className="textarea" value={v.note} onChange={(e) => set('note', e.target.value)} /></div>
        <div className="field"><label>Order</label>
          <input className="input" type="number" value={v.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></div>
        <div className="field full">
          <div className="toggle-row" style={{ padding: 0, border: 0 }}>
            <div><div className="t-title">Show in the app</div></div>
            <label className="toggle"><input type="checkbox" checked={v.active} onChange={(e) => set('active', e.target.checked)} /><span className="track" /><span className="thumb" /></label>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
