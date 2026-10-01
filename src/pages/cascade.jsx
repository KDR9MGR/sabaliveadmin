/* Shared pages for the staff hierarchy — Transfer Coins, Coin Transfer
   History and the owned-agencies list — used by Sub Admin, Agency and Country
   Admin. Data comes from lib/cascade.js: wallets are the balances, and
   transfers are validated server-side by the transfer_coins_down RPC. */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, Button, Tag, useToast } from '../components/ui.jsx'
import { personCol, statusCol, numCol, emailCol, roleCol, imageCol } from '../components/cells.jsx'
import DataTable from '../components/DataTable.jsx'
import UserPicker from '../components/UserPicker.jsx'
import { TableSkeleton, LoadError } from './_templates.jsx'
import { useAsyncData } from '../lib/useAsync.js'
import { profileOptions } from '../lib/coins.js'
import {
  myCoinBalance, transferCoinsDown, listCoinTransfers, listUserCoinHistory,
  listOwnedAgencies, ownedAgencyManagerOptions,
} from '../lib/cascade.js'
import { num } from '../data/index.js'

/* ------------------------------------------------------------------ Transfer Coins */
/* `kinds` = which recipient types this level may send to, each with the loader
   for its picker options, e.g.
   [{ value: 'agency', label: 'Agency', load: ownedAgencyManagerOptions },
    { value: 'user',   label: 'User',   load: profileOptions }]. */
export const USER_KIND = { value: 'user', label: 'User', load: profileOptions }
export const OWNED_AGENCY_KIND = { value: 'agency', label: 'Agency', load: ownedAgencyManagerOptions }
const EMPTY = { to: '', coins: '', note: '' }

export function TransferCoinsPage({ crumbs, kinds, hideHeader = false }) {
  const toast = useToast()
  const [kind, setKind] = useState(kinds[0].value)
  const [values, setValues] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }))

  const { data, loading, error, reload } = useAsyncData(async () => {
    const [balance, ...lists] = await Promise.all([myCoinBalance(), ...kinds.map((k) => k.load())])
    return { balance, options: Object.fromEntries(kinds.map((k, i) => [k.value, lists[i]])) }
  }, [])

  const submit = async () => {
    if (!values.to || !values.coins) { toast('Pick a recipient and an amount'); return }
    setBusy(true)
    try {
      await transferCoinsDown({ to: values.to, coins: values.coins, note: values.note })
      toast(`${num(values.coins)} coins sent`)
      setValues(EMPTY)
      reload()
    } catch (e) {
      toast(e.message || 'Transfer failed')
    } finally { setBusy(false) }
  }

  return (
    <>
      {!hideHeader && <PageHeader title="Transfer Coins" crumbs={crumbs} />}
      {error ? <LoadError error={error} onRetry={reload} />
        : loading || !data ? <TableSkeleton rows={4} />
        : (
          <Card title="Send coins" sub={`Your balance: ${num(data.balance)} coins — sent coins leave your balance`}>
            <div className="form-grid">
              {kinds.length > 1 && (
                <div className="field full">
                  <label>Send to</label>
                  <div className="hstack" style={{ gap: 8 }}>
                    {kinds.map((k) => (
                      <Button key={k.value} size="sm" variant={kind === k.value ? 'primary' : undefined}
                        onClick={() => { setKind(k.value); set('to', '') }}>{k.label}</Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="field full">
                <label>{kinds.find((k) => k.value === kind).label} <span className="req">*</span></label>
                <UserPicker
                  options={data.options[kind]}
                  value={values.to}
                  onChange={(v) => set('to', v)}
                  placeholder={kind === 'agency' ? 'Search agency or manager…' : kind === 'sub_admin' ? 'Search sub admin…' : kind === 'country_admin' ? 'Search country admin…' : undefined}
                />
                {kind !== 'user' && !data.options[kind].length && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    {kind === 'agency'
                      ? 'None of your agencies has a manager account yet, so there is nobody to send to.'
                      : kind === 'sub_admin'
                        ? 'There are no sub admins to send to yet — a Super Admin creates and assigns them.'
                        : 'There are no country admins yet — a Super Admin creates them.'}
                  </div>
                )}
              </div>
              <div className="field">
                <label>Amount (coins) <span className="req">*</span></label>
                <input className="input" type="number" min="1" placeholder="e.g. 500" value={values.coins} onChange={(e) => set('coins', e.target.value)} />
              </div>
              <div className="field full">
                <label>Note</label>
                <textarea className="textarea" placeholder="Reason for the transfer" value={values.note} onChange={(e) => set('note', e.target.value)} />
              </div>
            </div>
            <div className="hstack mt-16" style={{ justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={() => setValues(EMPTY)}>Clear</Button>
              <Button variant="primary" icon={busy ? 'refresh' : 'coins'} disabled={busy} onClick={submit}>
                {busy ? 'Sending…' : 'Send Coins'}
              </Button>
            </div>
          </Card>
        )}
    </>
  )
}

/* ------------------------------------------------------------------ Coin Transfer History */
/* `kind` = the recipient type this page lists: 'country_admin' | 'sub_admin' | 'agency' | 'user'. */
export function CoinHistoryPage({ title, crumbs, kind }) {
  const { data, loading, error, reload } = useAsyncData(
    () => (kind === 'user' ? listUserCoinHistory() : listCoinTransfers(kind)),
    [kind],
  )
  const showAgency = kind === 'agency' || kind === 'user'
  return (
    <>
      <PageHeader title={title} crumbs={crumbs} />
      {error ? <LoadError error={error} onRetry={reload} />
        : loading || !data ? <TableSkeleton />
        : (
          <DataTable
            rows={data}
            searchKeys={['recipient', 'username', 'from', 'agency', 'note', 'idShort']}
            columns={[
              { key: 'idShort', header: 'Ref', render: (r) => <span className="mono muted">{r.idShort}</span> },
              { key: 'from', header: 'From', sortable: true },
              personCol('recipient', 'username'),
              ...(showAgency ? [{ key: 'agency', header: 'Agency', render: (r) => (r.agency === '—' ? <span className="muted">—</span> : <Tag>{r.agency}</Tag>) }] : []),
              numCol('coins', 'Coins'),
              { key: 'note', header: 'Note' },
              { key: 'date', header: 'Date', sortable: true },
            ]}
            emptyText="No coin transfers yet."
          />
        )}
    </>
  )
}

/* ------------------------------------------------------------------ Agencies I own */
export function OwnedAgenciesPage({ crumbs, addPath }) {
  const nav = useNavigate()
  const { data, loading, error, reload } = useAsyncData(listOwnedAgencies, [])

  return (
    <>
      <PageHeader title="Agency" crumbs={crumbs}
        actions={<Button variant="primary" icon="plus" onClick={() => nav(addPath)}>Add Agency</Button>} />
      {error ? <LoadError error={error} onRetry={reload} />
        : loading || !data ? <TableSkeleton />
        : (
          <>
            <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
              Adding an agency also creates its own login. New agencies start as <b>Pending</b> until a platform
              admin approves them and sets the commission.
            </div></Card>
            <DataTable
              rows={data}
              searchKeys={['name', 'manager', 'displayId', 'country', 'email']}
              tabs={[
                { label: 'All', value: 'all', filter: () => true },
                { label: 'Active', value: 'a', filter: (r) => r.status === 'Active' },
                { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
                { label: 'Inactive', value: 'i', filter: (r) => r.status === 'Inactive' },
              ]}
              columns={[
                { key: 'displayId', header: 'Agency ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
                { key: 'name', header: 'Name', sortable: true },
                emailCol(),
                roleCol(),
                { ...personCol('manager', 'managerUsername'), header: 'Manager' },
                numCol('hosts', 'Hosts'),
                { key: 'country', header: 'Region' },
                numCol('commission', 'Commission', { suffix: '%' }),
                statusCol('status', 'Status'),
                imageCol(),
                { key: 'created', header: 'Created', sortable: true },
              ]}
              emptyText="You don't own any agencies yet — add one to get started."
            />
          </>
        )}
    </>
  )
}
