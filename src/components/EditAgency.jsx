import { useEffect, useState } from 'react'
import EntityForm from './EntityForm.jsx'
import { Drawer, useToast } from './ui.jsx'
import { supabase } from '../lib/supabase.js'
import { updateAgency } from '../lib/admin.js'
import { getStaffProfile, updateStaffProfile, updateStaffCredentials, inviteStaff } from '../lib/accounts.js'
import { scopeSubAdminOptions, transferAgency } from '../lib/country.js'

const STATUS_OPTS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

async function loadAgency(agencyId) {
  const [{ data: agency, error }, { data: mgrRows }, owners] = await Promise.all([
    supabase.from('agencies').select('id, name, country, commission_percent, status, sub_admin_id').eq('id', agencyId).maybeSingle(),
    supabase.from('staff_roles').select('user_id').eq('role', 'agency_manager').eq('agency_id', agencyId).limit(1),
    scopeSubAdminOptions().catch(() => []),
  ])
  if (error || !agency) throw new Error(error?.message || 'Agency not found')
  const managerId = mgrRows?.[0]?.user_id || null
  const manager = managerId ? await getStaffProfile(managerId) : null
  return { agency, managerId, manager, owners }
}

/* Master edits a whole agency: the same fields the Add Agency form collects
   (name, region, owning sub admin, and the agency login — manager name,
   username, email, phone, password) plus commission and status. Saved in
   stages (agency record, owner, manager profile, login), only the parts that
   changed; an agency with no manager can be given one here (creates the login
   and makes it the manager of record); if a later stage fails, the earlier ones are already applied and
   the message says so. */
export default function EditAgency({ agency: row, onClose, onSaved }) {
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const toast = useToast()

  useEffect(() => {
    loadAgency(row.id).then(setData).catch((e) => setLoadError(e?.message || 'Could not load this agency'))
  }, [row.id])

  if (!data) {
    return (
      <Drawer title={`Edit — ${row.name}`} onClose={onClose}>
        <div className="muted" style={{ fontSize: 13 }}>{loadError || 'Loading…'}</div>
      </Drawer>
    )
  }

  const { agency, managerId, manager, owners } = data
  const ownerOpts = owners.some((o) => o.value === agency.sub_admin_id) || !agency.sub_admin_id
    ? owners
    : [{ value: agency.sub_admin_id, label: 'Current owner' }, ...owners]

  const initial = {
    name: agency.name,
    country: agency.country || '',
    sub_admin: agency.sub_admin_id || '',
    commission_percent: agency.commission_percent,
    status: agency.status,
    full_name: manager?.name || '',
    username: manager?.username || '',
    email: manager?.email || '',
    phone: manager?.phone || '',
    password: '',
    confirm_password: '',
  }

  const save = async (v) => {
    const changed = (k) => String(v[k] ?? '') !== String(initial[k] ?? '')
    const agencyChanged = ['name', 'country', 'commission_percent', 'status'].some(changed)
    const ownerChanged = !!v.sub_admin && changed('sub_admin')
    const profileChanged = !!manager && ['full_name', 'username', 'phone'].some(changed)
    const newEmail = String(v.email || '').trim().toLowerCase()
    const emailChanged = !!manager && !!newEmail && newEmail !== String(initial.email).toLowerCase()
    const assignManager = !manager && !!newEmail
    // With no manager and no email the manager fields are ignored — a browser
    // may have autofilled them, and "leave the email blank" means stay unassigned.
    const password = manager || assignManager ? (v.password || '') : ''
    const confirm = manager || assignManager ? (v.confirm_password || '') : ''

    if (assignManager && !newEmail.includes('@')) throw new Error('Enter a valid manager email')
    if (password || confirm) {
      if (password !== confirm) throw new Error('Passwords do not match')
      if (password.length < 8) throw new Error('Password must be at least 8 characters')
    }
    if (!agencyChanged && !ownerChanged && !profileChanged && !emailChanged && !password && !assignManager) {
      throw new Error('No changes to save')
    }

    const done = []
    const stage = async (label, fn) => {
      try { await fn(); done.push(label) } catch (e) {
        if (done.length) onSaved?.()
        throw new Error(done.length ? `Saved: ${done.join(', ')}. But ${label} failed: ${e.message}` : e.message)
      }
    }

    if (agencyChanged) {
      await stage('agency details', () => updateAgency(agency.id, {
        name: v.name, commission_percent: v.commission_percent, status: v.status, country: v.country,
      }))
    }
    if (ownerChanged) await stage('owner', () => transferAgency({ agencyId: agency.id, toSubAdmin: v.sub_admin }))
    if (profileChanged) {
      await stage('manager profile', () => updateStaffProfile(managerId, {
        name: v.full_name || manager.name, username: v.username, phone: v.phone,
        location: manager.location, bio: manager.bio, avatar_url: null,
      }))
    }
    if (emailChanged || password) {
      await stage('login', () => updateStaffCredentials(managerId, { email: emailChanged ? newEmail : undefined, password }))
    }
    if (assignManager) {
      await stage('manager login', async () => {
        const res = await inviteStaff({
          email: newEmail, role: 'agency_manager', agency_id: agency.id,
          full_name: v.full_name || null, username: v.username || null, phone: v.phone || null,
          location: v.country || null, password: v.password || null,
        })
        if (res?.temp_password) {
          toast(`Manager ${res.email} assigned. Temporary password: ${res.temp_password} — share it securely.`)
        }
      })
    }
    onSaved?.()
  }

  return (
    <EntityForm
      title={`Edit — ${agency.name}`}
      onClose={onClose}
      onSubmit={save}
      savedMessage="Agency updated"
      initial={initial}
      fields={[
        { name: 'name', label: 'Agency name', required: true },
        { name: 'country', label: 'Region' },
        { name: 'sub_admin', label: 'Owned by sub admin', type: 'select', options: ownerOpts },
        { name: 'commission_percent', label: 'Commission %', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
        { name: 'login_section', type: 'section', label: 'Agency login', hint: manager ? undefined : 'This agency has no manager yet (it was revoked, or never created). Fill in the manager below to assign one — leave the email blank to keep it unassigned.' },
        ...(manager ? [
          { name: 'full_name', autoComplete: 'off', label: 'Manager name' },
          { name: 'username', autoComplete: 'off', label: 'Username', hint: '3-30 characters: letters, numbers, underscore' },
          { name: 'email', autoComplete: 'off', label: 'Email', type: 'email' },
          { name: 'phone', autoComplete: 'off', label: 'Phone' },
          { name: 'password', autoComplete: 'new-password', label: 'New password', type: 'password', hint: 'Leave blank to keep the current password (min 8 characters)' },
          { name: 'confirm_password', autoComplete: 'new-password', label: 'Confirm new password', type: 'password' },
        ] : [
          { name: 'full_name', autoComplete: 'off', label: 'Manager name' },
          { name: 'username', autoComplete: 'off', label: 'Username', hint: '3-30 characters: letters, numbers, underscore' },
          { name: 'email', autoComplete: 'off', label: 'Manager email', type: 'email', placeholder: 'manager@example.com' },
          { name: 'phone', autoComplete: 'off', label: 'Phone' },
          { name: 'password', autoComplete: 'new-password', label: 'Password', type: 'password', hint: 'Leave blank to generate a temporary password (min 8 characters if set)' },
          { name: 'confirm_password', autoComplete: 'new-password', label: 'Confirm password', type: 'password' },
        ]),
      ]}
    />
  )
}
