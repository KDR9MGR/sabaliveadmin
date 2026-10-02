import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Person, StatusBadge, Tag, ConfirmDialog, useToast } from '../../components/ui.jsx'
import DataTable from '../../components/DataTable.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listBans, liftBan, BAN_KINDS } from '../../lib/bans.js'

/* Every Live / ID / Device ban, past and present. The same rows the app reads:
   a ban listed Active here is being enforced on the user's phone and in the
   database right now. */
export function Bans() {
  const nav = useNavigate()
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listBans)
  const [lifting, setLifting] = useState(null)
  const [busy, setBusy] = useState(false)
  const list = rows || []

  const doLift = async () => {
    setBusy(true)
    try {
      await liftBan(lifting.id, 'Lifted from the admin panel')
      toast(`${lifting.kindLabel} on ${lifting.user} lifted`)
      setLifting(null)
      reload()
    } catch (e) {
      toast(e.message || 'Could not lift the ban')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Bans" crumbs={['Home', 'User Management', 'Bans']} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        Place a ban from a user's row or profile (<b>Restrict (ban)…</b>). <b>Live ban</b>: no watching, hosting, chat, gifts or seats.
        {' '}<b>ID ban</b>: the account is signed out and can't sign in (its devices are banned too).
        {' '}<b>Device ban</b>: the phone(s) the user has used, for any account. Each lasts 7 days, 30 days or permanently.
      </div></Card>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={list}
          pageSize={10}
          searchKeys={['user', 'username', 'reason', 'by', 'idShort']}
          searchPlaceholder="Search by user, reason or who placed it…"
          emptyText="No bans yet."
          tabs={[
            { label: 'Active', value: 'a', filter: (r) => r.state === 'Active' },
            { label: 'Expired', value: 'e', filter: (r) => r.state === 'Expired' },
            { label: 'Lifted', value: 'l', filter: (r) => r.state === 'Lifted' },
            { label: 'All', value: 'all', filter: () => true },
          ]}
          filters={[
            { label: 'Type', options: Object.values(BAN_KINDS).map((k) => k.label), get: (r) => r.kindLabel },
          ]}
          columns={[
            { key: 'user', header: 'User', sortable: true, render: (r) => <Person name={r.user} meta={r.username ? '@' + r.username : undefined} src={r.avatar} /> },
            { key: 'kindLabel', header: 'Type', render: (r) => <Tag>{r.kindLabel}</Tag> },
            { key: 'until', header: 'Until', render: (r) => (r.permanent ? <b>Permanent</b> : r.until) },
            { key: 'reason', header: 'Reason', render: (r) => (r.reason ? <span style={{ wordBreak: 'break-word' }}>{r.reason}</span> : <span className="muted">—</span>) },
            { key: 'devices', header: 'Devices', render: (r) => (r.kind === 'live' ? <span className="muted">—</span> : r.devices) },
            { key: 'by', header: 'Placed by', render: (r) => (
              <div>{r.by}<div className="muted" style={{ fontSize: 12 }}>{r.when}</div></div>
            ) },
            { key: 'state', header: 'State', render: (r) => (
              <div>
                <StatusBadge value={r.state} />
                {r.state === 'Lifted' && r.liftedBy && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>by {r.liftedBy}</div>}
              </div>
            ) },
          ]}
          rowActions={(r) => [
            { label: 'View user', icon: 'user', onClick: () => nav(`/admin/users/${r.userId}`) },
            ...(r.state === 'Active' ? [{ label: 'Lift ban', icon: 'check', onClick: () => setLifting(r) }] : []),
          ]}
        />
      </AsyncView>
      {lifting && (
        <ConfirmDialog
          title={`Lift ${lifting.kindLabel} on ${lifting.user}?`}
          confirmLabel="Lift ban"
          busy={busy}
          message={lifting.kind === 'account'
            ? 'They will be able to sign in again.'
            : lifting.kind === 'device'
              ? 'The devices covered by this ban will work again.'
              : 'They will be able to use live again.'}
          onConfirm={doLift}
          onClose={() => setLifting(null)}
        />
      )}
    </>
  )
}
