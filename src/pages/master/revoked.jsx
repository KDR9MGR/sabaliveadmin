import { useNavigate } from 'react-router-dom'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Person, StatusBadge, Tag } from '../../components/ui.jsx'
import DataTable from '../../components/DataTable.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listRevocations } from '../../lib/revocations.js'

/* Staff accounts and agency manager logins that have been revoked, and who
   revoked each. Read from the audit log, so it is a permanent record: an
   account that was given a role again shows as Restored rather than vanishing. */
export function RevokedUsers() {
  const nav = useNavigate()
  const { data: rows, loading, error, reload } = useAsyncData(listRevocations)

  return (
    <>
      <PageHeader title="Revoked Users" crumbs={['Home', 'Admin Management', 'Revoked Users']} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        Every time a staff role or an agency's manager login is revoked, it is recorded here with the person who did it.
        {' '}An <b>agency manager</b> revoke is logged against the agency (all of its manager logins are removed and it is set Inactive).
      </div></Card>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          pageSize={10}
          searchKeys={['user', 'username', 'by', 'byUsername', 'role']}
          searchPlaceholder="Search by user, role or who revoked…"
          emptyText="Nothing has been revoked yet."
          tabs={[
            { label: 'Revoked', value: 'r', filter: (r) => r.state === 'Revoked' },
            { label: 'Restored', value: 's', filter: (r) => r.state === 'Restored' },
            { label: 'All', value: 'all', filter: () => true },
          ]}
          filters={[
            { label: 'Type', options: ['Staff account', 'Agency manager'], get: (r) => r.kind },
          ]}
          columns={[
            { key: 'user', header: 'User / Agency', sortable: true, render: (r) => (
              <Person name={r.user} meta={r.username ? '@' + r.username : r.kind} src={r.avatar} />
            ) },
            { key: 'role', header: 'Role', render: (r) => <Tag>{r.role}</Tag> },
            { key: 'by', header: 'Revoked by', render: (r) => (
              <div>{r.by}{r.byUsername && <div className="muted" style={{ fontSize: 12 }}>@{r.byUsername}</div>}</div>
            ) },
            { key: 'at', header: 'When' },
            { key: 'state', header: 'Status', render: (r) => <StatusBadge value={r.state} /> },
          ]}
          rowActions={(r) => [
            ...(r.userId ? [{ label: 'View user', icon: 'user', onClick: () => nav(`/admin/users/${r.userId}`) }] : []),
            ...(r.agencyId ? [{ label: 'View agency', icon: 'building', onClick: () => nav(`/admin/agencies/${r.agencyId}`) }] : []),
          ]}
        />
      </AsyncView>
    </>
  )
}
