import { useState } from 'react'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, useToast, EmptyState } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import {
  listGifts, createGift, updateGift, deleteGift,
  listCoinPackages, createCoinPackage, updateCoinPackage, deleteCoinPackage,
  listWalletLedger, listGiftTransactions,
  createCoinGrant, listCoinGrants, profileOptions,
  GIFT_CATEGORIES, PLATFORMS,
} from '../../lib/coins.js'

const CRUMBS = ['Home', 'Coin & Gift Management']
const opt = (v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })
const CAT_OPTS = GIFT_CATEGORIES.map(opt)
const PLATFORM_OPTS = PLATFORMS.map((p) => ({ value: p, label: p === 'ios' ? 'iOS' : p.charAt(0).toUpperCase() + p.slice(1) }))
const STATUS_OPTS = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]

/* ------------------------------------------------------------------ Gift Settings (real CRUD) */
export function GiftSettings() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listGifts)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const list = rows || []

  const remove = async (r) => {
    try { await deleteGift(r.id); toast(`${r.name} deleted`); reload() }
    catch (e) { toast(e.message || 'Delete failed') }
  }

  const giftFields = [
    { name: 'name', label: 'Gift name', required: true },
    { name: 'emoji', label: 'Icon / emoji', placeholder: '🎁' },
    { name: 'price_coins', label: 'Price (coins)', type: 'number', required: true, hint: 'Must be greater than 0' },
    { name: 'category', label: 'Category', type: 'select', options: CAT_OPTS, required: true },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
    { name: 'has_effect', label: 'Full-screen animation', type: 'toggle', full: true },
  ]

  return (
    <>
      <PageHeader
        title="Coin & Gift Management"
        crumbs={[...CRUMBS, 'Gift Settings']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Gift</Button>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        {list.length > 0 && (
          <div className="gallery" style={{ marginBottom: 20 }}>
            {list.map((g) => (
              <div className="gallery__item" key={g.id}>
                <div className="gallery__preview">{g.emoji}</div>
                <div className="gallery__meta">
                  <div>
                    <div className="n">{g.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{g.price} coins</div>
                  </div>
                  <StatusBadge value={g.status} />
                </div>
              </div>
            ))}
          </div>
        )}
        <DataTable
          rows={list}
          searchKeys={['name', 'category', 'idShort']}
          filters={[
            { label: 'Category', options: GIFT_CATEGORIES.map((c) => c[0].toUpperCase() + c.slice(1)), get: (r) => r.category },
            { label: 'Status', options: ['Active', 'Inactive'], get: (r) => r.status },
          ]}
          columns={[
            { key: 'name', header: 'Gift', sortable: true, render: (r) => <span className="hstack" style={{ gap: 10 }}><span style={{ fontSize: 20 }}>{r.emoji}</span><b>{r.name}</b></span> },
            numCol('price', 'Price (coins)'),
            { key: 'category', header: 'Category', render: (r) => <Tag>{r.category}</Tag> },
            { key: 'hasEffect', header: 'Animation', render: (r) => r.hasEffect ? <StatusBadge value="Yes" /> : <span className="muted">No</span> },
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) },
            { label: r.status === 'Active' ? 'Disable' : 'Enable', icon: 'lock', onClick: async () => { await updateGift(r.id, { status: r.status === 'Active' ? 'inactive' : 'active' }); toast('Updated'); reload() } },
            { sep: true },
            { label: 'Delete', icon: 'trash', onClick: () => remove(r) },
          ]}
          emptyText="No gifts configured yet."
        />
      </AsyncView>

      {adding && (
        <EntityForm title="Add Gift" onClose={() => setAdding(false)} savedMessage="Gift created"
          onSubmit={async (v) => { await createGift(v); reload() }}
          initial={{ category: 'basic', status: 'active' }} fields={giftFields} />
      )}
      {editing && (
        <EntityForm title={`Edit — ${editing.name}`} onClose={() => setEditing(null)} savedMessage="Gift updated"
          onSubmit={async (v) => { await updateGift(editing.id, v); reload() }}
          initial={{
            name: editing.name, emoji: editing.emoji, price_coins: editing.price,
            category: editing.category.toLowerCase(), status: editing.status.toLowerCase(), has_effect: editing.hasEffect,
          }}
          fields={giftFields} />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Coin Packages (real CRUD) */
export function CoinPackages() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listCoinPackages)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const pkgFields = [
    { name: 'name', label: 'Package name', required: true },
    { name: 'coins', label: 'Coins', type: 'number', required: true, hint: 'Must be greater than 0' },
    { name: 'bonus_coins', label: 'Bonus coins', type: 'number' },
    { name: 'price_inr', label: 'Price (₹)', type: 'number', required: true },
    { name: 'platform', label: 'Platform', type: 'select', options: PLATFORM_OPTS },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ]

  return (
    <>
      <PageHeader
        title="Coin Packages"
        crumbs={[...CRUMBS, 'Coin Packages']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Package</Button>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['name', 'idShort']}
          filters={[
            { label: 'Platform', options: ['All', 'Android', 'iOS'], get: (r) => r.platform },
            { label: 'Status', options: ['Active', 'Inactive'], get: (r) => r.status },
          ]}
          columns={[
            { key: 'name', header: 'Package', sortable: true, render: (r) => <b>{r.name}</b> },
            numCol('coins', 'Coins'),
            numCol('bonus', 'Bonus'),
            numCol('price', 'Price', { prefix: '₹' }),
            { key: 'platform', header: 'Platform', render: (r) => <Tag>{r.platform}</Tag> },
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) },
            { label: r.status === 'Active' ? 'Disable' : 'Enable', icon: 'lock', onClick: async () => { await updateCoinPackage(r.id, { status: r.status === 'Active' ? 'inactive' : 'active' }); toast('Updated'); reload() } },
            { sep: true },
            { label: 'Delete', icon: 'trash', onClick: async () => { try { await deleteCoinPackage(r.id); toast('Deleted'); reload() } catch (e) { toast(e.message) } } },
          ]}
          emptyText="No coin packages yet."
        />
      </AsyncView>

      {adding && (
        <EntityForm title="Add Coin Package" onClose={() => setAdding(false)} savedMessage="Package created"
          onSubmit={async (v) => { await createCoinPackage(v); reload() }}
          initial={{ platform: 'all', status: 'active', bonus_coins: 0 }} fields={pkgFields} />
      )}
      {editing && (
        <EntityForm title={`Edit — ${editing.name}`} onClose={() => setEditing(null)} savedMessage="Package updated"
          onSubmit={async (v) => { await updateCoinPackage(editing.id, v); reload() }}
          initial={{
            name: editing.name, coins: editing.coins, bonus_coins: editing.bonus, price_inr: editing.price,
            platform: editing.platform.toLowerCase() === 'ios' ? 'ios' : editing.platform.toLowerCase(),
            status: editing.status.toLowerCase(),
          }}
          fields={pkgFields} />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Transactions (real: wallet_ledger) */
export function Transactions() {
  const { data: rows, loading, error, reload } = useAsyncData(listWalletLedger)
  return (
    <>
      <PageHeader title="Transactions" crumbs={[...CRUMBS, 'Transactions']}
        actions={<Button icon="download">Export</Button>} />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          pageSize={12}
          searchKeys={['user', 'username', 'note', 'idShort']}
          tabs={[
            { label: 'All', value: 'all', filter: () => true },
            { label: 'Purchases', value: 'p', filter: (r) => r.kind === 'Purchase' },
            { label: 'Gifts', value: 'g', filter: (r) => r.kind.startsWith('Gift') },
            { label: 'Grants', value: 'r', filter: (r) => r.kind === 'Grant' },
            { label: 'Withdrawals', value: 'w', filter: (r) => r.kind === 'Withdrawal' },
          ]}
          filters={[{ label: 'Currency', options: ['Coins', 'Diamonds'], get: (r) => r.currency }]}
          columns={[
            { key: 'idShort', header: 'Ref', render: (r) => <span className="mono muted">{r.idShort}</span> },
            personCol('user', 'username'),
            { key: 'kind', header: 'Type', render: (r) => <Tag>{r.kind}</Tag> },
            { key: 'amount', header: 'Amount', align: 'right', render: (r) => (
              <span className="mono" style={{ color: r.amount < 0 ? 'var(--danger)' : 'var(--success)' }}>
                {r.amount > 0 ? '+' : ''}{Number(r.amount).toLocaleString()} {r.currency.toLowerCase()}
              </span>
            ) },
            { key: 'note', header: 'Note' },
            { key: 'date', header: 'Date', sortable: true },
          ]}
          emptyText="No wallet activity yet. Recharges, gifts, grants and withdrawals all land in this ledger."
        />
      </AsyncView>
    </>
  )
}

/* ------------------------------------------------------------------ Gift History (real: gift_transactions) */
export function GiftHistory() {
  const { data: rows, loading, error, reload } = useAsyncData(listGiftTransactions)
  return (
    <>
      <PageHeader title="Gift History" crumbs={[...CRUMBS, 'Gift History']}
        actions={<Button icon="download">Export</Button>} />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          pageSize={12}
          searchKeys={['sender', 'receiver', 'gift', 'idShort']}
          columns={[
            { key: 'idShort', header: 'Ref', render: (r) => <span className="mono muted">{r.idShort}</span> },
            { key: 'sender', header: 'From', render: (r) => <Person name={r.sender} size="sm" /> },
            { key: 'receiver', header: 'To', render: (r) => <Person name={r.receiver} size="sm" /> },
            { key: 'gift', header: 'Gift', render: (r) => <Tag>{r.gift}</Tag> },
            numCol('coins', 'Coins'),
            { key: 'date', header: 'Date', sortable: true },
          ]}
          emptyText="No gifts sent yet."
        />
      </AsyncView>
    </>
  )
}

/* ------------------------------------------------------------------ Transfer Coins (real: coin_grants insert) */
export function TransferCoins() {
  const toast = useToast()
  const { data: opts } = useAsyncData(profileOptions)
  const { data: recent, reload } = useAsyncData(listCoinGrants)
  const [busy, setBusy] = useState(false)
  const [values, setValues] = useState({ granted_to: '', coins: '', note: '' })
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }))

  const submit = async () => {
    if (!values.granted_to || !values.coins) { toast('Pick a recipient and an amount'); return }
    setBusy(true)
    try {
      await createCoinGrant(values)
      toast(`${values.coins} coins granted`)
      setValues({ granted_to: '', coins: '', note: '' })
      reload()
    } catch (e) {
      toast(e.message || 'Grant failed')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Transfer Coins" crumbs={[...CRUMBS, 'Transfer Coins']} />
      <div className="grid dash">
        <Card title="New coin grant" sub="Credits the recipient's wallet immediately (via the coin_grants trigger)">
          <div className="form-grid">
            <div className="field full">
              <label>Recipient <span className="req">*</span></label>
              <select className="select" value={values.granted_to} onChange={(e) => set('granted_to', e.target.value)}>
                <option value="">Select a user…</option>
                {(opts || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Amount (coins) <span className="req">*</span></label>
              <input className="input" type="number" placeholder="e.g. 5000" value={values.coins} onChange={(e) => set('coins', e.target.value)} />
            </div>
            <div className="field full">
              <label>Note</label>
              <textarea className="textarea" placeholder="Reason for the grant (shown in Transfer History and the wallet ledger)" value={values.note} onChange={(e) => set('note', e.target.value)} />
            </div>
          </div>
          <div className="hstack mt-16" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setValues({ granted_to: '', coins: '', note: '' })}>Clear</Button>
            <Button variant="primary" icon={busy ? 'refresh' : 'coins'} disabled={busy} onClick={submit}>
              {busy ? 'Granting…' : 'Grant Coins'}
            </Button>
          </div>
        </Card>
        <Card title="Recent grants">
          {(recent || []).length ? (
            <div className="feed">
              {(recent || []).slice(0, 6).map((g) => (
                <div className="feed__item" key={g.id}>
                  <span className="feed__dot"><span style={{ fontSize: 13 }}>🪙</span></span>
                  <div>
                    <div className="feed__text"><b>{Number(g.coins).toLocaleString()}</b> → {g.recipient}</div>
                    <div className="feed__time">{g.date} · {g.note}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="coins" title="No grants yet" />}
        </Card>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Transfer History (real: coin_grants list) */
export function TransferHistory() {
  const { data: rows, loading, error, reload } = useAsyncData(listCoinGrants)
  return (
    <>
      <PageHeader title="Coin Transfer History" crumbs={[...CRUMBS, 'Transfer History']}
        actions={<Button icon="download">Export</Button>} />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          pageSize={12}
          searchKeys={['recipient', 'username', 'by', 'note', 'idShort']}
          columns={[
            { key: 'idShort', header: 'Ref', render: (r) => <span className="mono muted">{r.idShort}</span> },
            personCol('recipient', 'username'),
            numCol('coins', 'Coins'),
            { key: 'by', header: 'Granted by' },
            { key: 'note', header: 'Note' },
            { key: 'date', header: 'Date', sortable: true },
          ]}
          emptyText="No coin grants recorded yet."
        />
      </AsyncView>
    </>
  )
}
