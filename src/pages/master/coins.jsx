import { useState } from 'react'
import { ListPage, StatGrid } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, PillTabs, useToast } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import { BarChart } from '../../components/charts.jsx'
import {
  gifts, coinPackages, transactions,
  transferToSubAdmin, transferToAgency, transferToUser,
} from '../../data/index.js'
import { AGENCIES } from '../../data/util.js'

const CRUMBS = ['Home', 'Coin & Gift Management']

/* ------------------------------------------------------------------ Gift Settings */
export function GiftSettings() {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader
        title="Coin & Gift Management"
        crumbs={[...CRUMBS, 'Gift Settings']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Gift</Button>}
      />
      <DataTable
        rows={gifts}
        searchKeys={['name', 'id', 'category']}
        filters={[
          { label: 'Type', options: ['Normal', 'Premium', 'Luxury'], get: (r) => r.type },
          { label: 'Category', options: [...new Set(gifts.map((g) => g.category))], get: (r) => r.category },
        ]}
        columns={[
          { key: 'name', header: 'Gift Name', sortable: true, render: (r) => <span className="hstack" style={{ gap: 10 }}><span style={{ fontSize: 22 }}>{r.icon}</span><b>{r.name}</b></span> },
          { key: 'id', header: 'ID', render: (r) => <span className="mono muted">{r.id}</span> },
          numCol('price', 'Price (Coins)'),
          { key: 'type', header: 'Type', render: (r) => <Tag>{r.type}</Tag> },
          { key: 'category', header: 'Category' },
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
          { label: 'Replace animation', icon: 'upload', onClick: () => toast('Upload asset') },
          { label: r.status === 'Active' ? 'Disable' : 'Enable', icon: 'lock', onClick: () => toast(`${r.name} toggled`) },
          { sep: true },
          { label: 'Delete', icon: 'trash', onClick: () => toast(`${r.name} deleted`) },
        ]}
      />
      {adding && (
        <EntityForm title="Add Gift" onClose={() => setAdding(false)} savedMessage="Gift created"
          fields={[
            { name: 'name', label: 'Gift name', required: true },
            { name: 'emoji', label: 'Icon / emoji', placeholder: '🎁' },
            { name: 'price', label: 'Price (coins)', type: 'number', required: true },
            { name: 'type', label: 'Type', type: 'select', options: ['Normal', 'Premium', 'Luxury'], required: true },
            { name: 'category', label: 'Category', type: 'select', options: ['Basic', 'Luxury', 'Vehicle', 'Special'] },
            { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
            { name: 'animated', label: 'Has full-screen animation', type: 'toggle', full: true },
          ]}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Coin Packages */
export function CoinPackages() {
  const toast = useToast()
  return (
    <ListPage
      title="Coin Packages"
      crumbs={[...CRUMBS, 'Coin Packages']}
      actions={<Button variant="primary" icon="plus" onClick={() => toast('Add package')}>Add Package</Button>}
      rows={coinPackages}
      searchKeys={['name', 'id']}
      filters={[{ label: 'Platform', options: ['All', 'Android', 'iOS'], get: (r) => r.platform }]}
      columns={[
        { key: 'name', header: 'Package', sortable: true, render: (r) => <b>{r.name}</b> },
        numCol('coins', 'Coins'),
        numCol('bonus', 'Bonus'),
        numCol('price', 'Price', { prefix: '₹' }),
        { key: 'platform', header: 'Platform', render: (r) => <Tag>{r.platform}</Tag> },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
        { label: 'Duplicate', icon: 'layers', onClick: () => toast('Duplicated') },
        { label: r.status === 'Active' ? 'Disable' : 'Enable', icon: 'lock', onClick: () => toast('Toggled') },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Transactions */
export function Transactions() {
  return (
    <ListPage
      title="Transactions"
      crumbs={[...CRUMBS, 'Transactions']}
      actions={<Button icon="download">Export CSV</Button>}
      rows={transactions}
      searchKeys={['user', 'id', 'method']}
      tabs={[
        { label: 'All', value: 'all', filter: () => true },
        { label: 'Recharges', value: 'r', filter: (r) => r.type === 'Recharge' },
        { label: 'Withdrawals', value: 'w', filter: (r) => r.type === 'Withdrawal' },
        { label: 'Failed', value: 'f', filter: (r) => r.status === 'Failed' },
      ]}
      filters={[
        { label: 'Method', options: ['UPI', 'Card', 'Wallet', 'NetBanking', 'In-App'], get: (r) => r.method },
        { label: 'Status', options: ['Success', 'Pending', 'Failed'], get: (r) => r.status },
      ]}
      columns={[
        { key: 'id', header: 'Txn ID', render: (r) => <span className="mono muted">{r.id}</span> },
        personCol('user'),
        { key: 'type', header: 'Type', render: (r) => <Tag>{r.type}</Tag> },
        numCol('amount', 'Amount', { prefix: '₹' }),
        numCol('coins', 'Coins'),
        { key: 'method', header: 'Method' },
        { key: 'date', header: 'Date', sortable: true },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'View receipt', icon: 'fileText', onClick: () => {} },
        { label: 'Refund', icon: 'refresh', onClick: () => {} },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Gift History */
export function GiftHistory() {
  const rows = transactions.filter((t) => t.type.includes('Gift')).concat(
    Array.from({ length: 30 }, (_, i) => ({
      id: 'GHX' + (2200 + i),
      user: transactions[i % transactions.length].user,
      type: 'Gift Sent',
      gift: gifts[i % gifts.length].name,
      to: ['Priya Sharma', 'Neha Singh', 'Riya Mehta', 'Pooja Verma'][i % 4],
      coins: gifts[i % gifts.length].price * ((i % 5) + 1),
      date: (i % 28 + 1) + ' Aug 2026',
      status: 'Success',
    }))
  )
  return (
    <ListPage
      title="Gift History"
      crumbs={[...CRUMBS, 'Gift History']}
      actions={<Button icon="download">Export</Button>}
      rows={rows}
      searchKeys={['user', 'to', 'gift', 'id']}
      columns={[
        { key: 'id', header: 'Ref', render: (r) => <span className="mono muted">{r.id}</span> },
        personCol('user', undefined),
        { key: 'gift', header: 'Gift', render: (r) => <Tag>{r.gift || '—'}</Tag> },
        { key: 'to', header: 'Sent to', render: (r) => r.to ? <Person name={r.to} size="sm" /> : '—' },
        numCol('coins', 'Coins'),
        { key: 'date', header: 'Date', sortable: true },
        statusCol(),
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Transfer Coins (form) */
export function TransferCoins() {
  const toast = useToast()
  const [target, setTarget] = useState('Sub Admin')
  const [amount, setAmount] = useState('')
  const targets = {
    'Sub Admin': ['Neha Verma', 'Rohit Bose', 'Kavya Iyer', 'Manish Das'],
    Agency: AGENCIES,
    User: ['Rahul Kumar', 'Priya Sharma', 'Amit Verma', 'Simran Kaur'],
  }
  return (
    <>
      <PageHeader title="Transfer Coins" crumbs={[...CRUMBS, 'Transfer Coins']} />
      <div className="grid dash">
        <Card title="New coin transfer">
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Transfer to</label>
            <PillTabs tabs={['Sub Admin', 'Agency', 'User']} value={target} onChange={setTarget} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Recipient <span className="req">*</span></label>
              <select className="select"><option value="">Select {target.toLowerCase()}…</option>{targets[target].map((t) => <option key={t}>{t}</option>)}</select>
            </div>
            <div className="field">
              <label>Amount (coins) <span className="req">*</span></label>
              <input className="input" type="number" placeholder="e.g. 50000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="field full">
              <label>Note</label>
              <textarea className="textarea" placeholder="Reason for transfer (appears in history)" />
            </div>
            <div className="field full">
              <label className="checkbox"><input type="checkbox" /> Notify recipient by push notification</label>
            </div>
          </div>
          <div className="hstack mt-16" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setAmount('')}>Clear</Button>
            <Button variant="primary" icon="coins" onClick={() => { toast(`Transferred ${amount || 0} coins to ${target}`); setAmount('') }}>Transfer Coins</Button>
          </div>
        </Card>
        <div className="vstack" style={{ gap: 16 }}>
          <Card title="Master coin balance">
            <div className="stat__value" style={{ fontSize: 30 }}>82,40,500</div>
            <div className="muted" style={{ fontSize: 12 }}>Available for distribution</div>
            <div className="kpi-row mt-16">
              <div className="kpi"><div className="k">Sent (Aug)</div><div className="v">26,100</div></div>
              <div className="kpi"><div className="k">Pending</div><div className="v">3,200</div></div>
            </div>
          </Card>
          <Card title="Recent transfers">
            <div className="feed">
              {transferToAgency.slice(0, 4).map((t) => (
                <div className="feed__item" key={t.id}>
                  <span className="feed__dot"><span style={{ fontSize: 13 }}>🪙</span></span>
                  <div><div className="feed__text"><b>{t.coins.toLocaleString()}</b> → {t.target}</div><div className="feed__time">{t.date} · {t.note}</div></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Transfer History (3 sub-tabs) */
export function TransferHistory() {
  const [tab, setTab] = useState('Sub Admin')
  const data = { 'Sub Admin': transferToSubAdmin, Agency: transferToAgency, User: transferToUser }[tab]
  return (
    <>
      <PageHeader
        title="Coin Transfer History"
        crumbs={[...CRUMBS, 'Transfer History']}
        actions={<Button icon="download">Export</Button>}
      />
      <div style={{ marginBottom: 14 }}>
        <PillTabs tabs={['Sub Admin', 'Agency', 'User']} value={tab} onChange={setTab} />
      </div>
      <DataTable
        key={tab}
        rows={data}
        searchKeys={['target', 'note', 'id']}
        filters={[{ label: 'Status', options: ['Completed', 'Reversed'], get: (r) => r.status }]}
        columns={[
          { key: 'id', header: 'Ref', render: (r) => <span className="mono muted">{r.id}</span> },
          { key: 'target', header: `To (${tab})`, sortable: true },
          numCol('coins', 'Coins'),
          { key: 'by', header: 'Transferred by' },
          { key: 'note', header: 'Note' },
          { key: 'date', header: 'Date', sortable: true },
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'View', icon: 'eye', onClick: () => {} },
          { label: 'Reverse', icon: 'refresh', onClick: () => {} },
        ]}
      />
    </>
  )
}
