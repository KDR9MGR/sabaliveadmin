import { useState } from 'react'
import EntityForm from './EntityForm.jsx'
import EditStaffProfile from './EditStaffProfile.jsx'
import { ConfirmDialog, useToast } from './ui.jsx'
import { useAuth } from '../lib/auth.jsx'
import { revokeRole, revokeAgencyManager } from '../lib/accounts.js'
import { updateAgency } from '../lib/admin.js'

const AGENCY_STATUS_OPTS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

/* Revoke an agency's manager login AND set the agency Inactive (one server
   call, atomic). Shared by the Master agency lists. */
export function RevokeAgencyManagerDialog({ agency, onClose, onDone }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      const res = await revokeAgencyManager(agency.id)
      toast(`${agency.name} is now Inactive${res?.revoked ? ` — ${res.revoked} manager login revoked` : ''}`)
      onClose()
      onDone?.()
    } catch (e) {
      toast(e.message || 'Could not revoke')
    } finally { setBusy(false) }
  }
  return (
    <ConfirmDialog
      title="Revoke agency manager?"
      danger
      busy={busy}
      confirmLabel="Revoke & set Inactive"
      message={`${agency.name}: the agency manager's login role is removed and the agency is set to Inactive. Its hosts and history are kept, and the Saba Live accounts are not deleted.`}
      onConfirm={run}
      onClose={onClose}
    />
  )
}

function downlineNote(r) {
  if (r.subAdmins != null) return ` Their ${r.subAdmins} sub admin(s), ${r.agencies} agencies and ${r.hosts} hosts stay as they are but lose this parent.`
  if (r.agencies != null) return ` Their ${r.agencies} agencies and ${r.hosts} hosts stay as they are but lose this owner.`
  return ''
}

/* Master-only row actions for the staff / agency lists. Owns the dialog state
   and hands the table its `rowActions`:
     kind 'staff'  -> Edit profile, Revoke role      (Country / Sub Admin rows)
     kind 'agency' -> Edit agency, Revoke manager & set Inactive */
export default function StaffRowManager({ kind = 'staff', reload, children }) {
  const toast = useToast()
  const { user } = useAuth()
  const [editing, setEditing] = useState(null)
  const [revoking, setRevoking] = useState(null)
  const [busy, setBusy] = useState(false)

  const rowActions = (r) => (kind === 'agency'
    ? [
      { label: 'Edit agency', icon: 'edit', onClick: () => setEditing(r) },
      { sep: true },
      { label: 'Revoke manager & set Inactive', icon: 'trash', onClick: () => setRevoking(r) },
    ]
    : [
      { label: 'Edit profile', icon: 'edit', onClick: () => setEditing(r) },
      { sep: true },
      r.id === user?.id
        ? { label: "Can't revoke yourself", icon: 'lock', onClick: () => {} }
        : { label: 'Revoke role', icon: 'trash', onClick: () => setRevoking(r) },
    ])

  const doRevokeRole = async () => {
    setBusy(true)
    try {
      await revokeRole(revoking.id)
      toast(`${revoking.name}'s role revoked`)
      setRevoking(null)
      reload?.()
    } catch (e) {
      toast(e.message || 'Could not revoke')
    } finally { setBusy(false) }
  }

  return (
    <>
      {children(rowActions)}

      {editing && kind === 'staff' && (
        <EditStaffProfile account={editing} onClose={() => setEditing(null)} onSaved={() => reload?.()} />
      )}
      {editing && kind === 'agency' && (
        <EntityForm
          title={`Edit — ${editing.name}`}
          onClose={() => setEditing(null)}
          savedMessage="Agency updated"
          onSubmit={async (v) => {
            await updateAgency(editing.id, { name: v.name, commission_percent: v.commission_percent, status: v.status, country: v.country })
            reload?.()
          }}
          initial={{
            name: editing.name,
            commission_percent: editing.commission,
            country: editing.country,
            status: String(editing.status || '').toLowerCase(),
          }}
          fields={[
            { name: 'name', label: 'Agency name', required: true },
            { name: 'commission_percent', label: 'Commission %', type: 'number' },
            { name: 'country', label: 'Region' },
            { name: 'status', label: 'Status', type: 'select', options: AGENCY_STATUS_OPTS },
          ]}
        />
      )}

      {revoking && kind === 'staff' && (
        <ConfirmDialog
          title="Revoke staff role?"
          danger
          busy={busy}
          confirmLabel="Revoke"
          message={`${revoking.name} (@${revoking.username}) will lose the "${revoking.role}" role and all admin access. Their Saba Live account is not deleted.${downlineNote(revoking)}`}
          onConfirm={doRevokeRole}
          onClose={() => setRevoking(null)}
        />
      )}
      {revoking && kind === 'agency' && (
        <RevokeAgencyManagerDialog agency={revoking} onClose={() => setRevoking(null)} onDone={reload} />
      )}
    </>
  )
}
