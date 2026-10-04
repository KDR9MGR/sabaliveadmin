import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Person, StatusBadge, Tag, ConfirmDialog, useToast } from '../../components/ui.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import DataTable from '../../components/DataTable.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listRevocations } from '../../lib/revocations.js'
import { restoreRole, agencyOptions, countryAdminOptions } from '../../lib/accounts.js'

/* Staff accounts and agency manager logins that have been revoked, and who
   revoked each. Read from the audit log, so it is a permanent record: an
   account that was given a role again shows as Restored rather than vanishing. */
export function RevokedUsers({ crumbRoot = ['Home', 'Admin Management'] }) {
  const nav = useNavigate()
  const toast = useToast()
  const [lifting, setLifting] = useState(null)
  const [busy, setBusy] = useState(false)
  const { data: extra } = useAsyncData(async () => ({
    agencies: await agencyOptions().catch(() => []),
    owners: await countryAdminOptions().catch(() => []),
  }))
  const { data: rows, loading, error, reload } = useAsyncData(listRevocations)

  const lift = async (v) => {
    await restoreRole(lifting.userId, { role: lifting.roleRaw, agency_id: v?.agency_id, country_admin_id: v?.country_admin_id })
    toast(`${lifting.user} is ${lifting.role} again`)
    reload()
  }
  const liftSimple = async () => {
    setBusy(true)
    try { await lift(); setLifting(null) } catch (e) { toast(e.message || 'Could not lift the revoke') } finally { setBusy(false) }
  }
  const needsPick = lifting && ['agency_manager', 'sub_admin'].includes(lifting.roleRaw)

  return (
    <>
      <PageHeader title="Revoked Users" crumbs={[...crumbRoot, 'Revoked Users']} />
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
            ...(r.userId && r.state === 'Revoked' && r.roleRaw ? [{ label: 'Lift revoke', icon: 'check', onClick: () => setLifting(r) }] : []),
            ...(r.userId ? [{ label: 'View user', icon: 'user', onClick: () => nav(`/admin/users/${r.userId}`) }] : []),
            ...(r.agencyId ? [{ label: 'View agency', icon: 'building', onClick: () => nav(`/admin/agencies/${r.agencyId}`) }] : []),
          ]}
        />
      </AsyncView>
      {lifting && !needsPick && (
        <ConfirmDialog
          title={`Lift revoke on ${lifting.user}?`}
          confirmLabel="Lift revoke"
          busy={busy}
          message={`${lifting.user} gets the ${lifting.role} role back straight away and can sign in to that panel again.`}
          onConfirm={liftSimple}
          onClose={() => setLifting(null)}
        />
      )}
      {lifting && needsPick && (
        <EntityForm
          title={`Lift revoke — ${lifting.user}`}
          submitLabel="Lift revoke"
          onClose={() => setLifting(null)}
          onSubmit={async (v) => {
            if (lifting.roleRaw === 'agency_manager' && !v.agency_id) throw new Error('Pick the agency this account manages')
            await lift(v)
          }}
          initial={{ agency_id: '', country_admin_id: '' }}
          fields={lifting.roleRaw === 'agency_manager'
            ? [{ name: 'agency_id', label: 'Agency', type: 'select', required: true, options: extra?.agencies || [], hint: 'The revoke does not record which agency it was — pick it.' }]
            : [{ name: 'country_admin_id', label: 'Reports to (Country Admin)', type: 'select', options: extra?.owners || [], hint: 'Optional.' }]}
        />
      )}
    </>
  )
}
