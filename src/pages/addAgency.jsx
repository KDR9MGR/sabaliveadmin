/* "Add Agency" — an agency in the hierarchy is an agency record PLUS its own
   standalone login (an agency_manager account), created in one step.
     owner.mode 'self'  — the caller is a Sub Admin and owns the new agency
     owner.mode 'pick'  — a Country / Global Admin picks which sub admin owns it
                          (owner.load() returns that list: only their own for a
                          Country Admin, every sub admin for a Global Admin)
   Step 1 creates the agency through an RPC (it starts Pending until a platform
   admin approves it and sets the commission); step 2 creates the manager login
   through invite-staff. If step 2 fails the agency already exists, so the form
   remembers it and a retry only redoes the login. */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, Button, EmptyState } from '../components/ui.jsx'
import { useAsyncData } from '../lib/useAsync.js'
import { inviteStaff } from '../lib/accounts.js'
import { createSubAdminAgency } from '../lib/cascade.js'
import { createCountryAgency } from '../lib/country.js'

export function AddAgencyForm({ title = 'Add Agency', crumbRoot, backTo, owner }) {
  const nav = useNavigate()
  const { data: owners } = useAsyncData(() => (owner.mode === 'pick' ? owner.load() : Promise.resolve([])), [])
  const [v, setV] = useState({
    name: '', country: 'India', sub_admin: '',
    full_name: '', username: '', email: '', phone: '', password: '', confirm_password: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState(null)
  const [result, setResult] = useState(null)
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }))

  const submit = async () => {
    setError('')
    if (!v.name.trim()) return setError('Agency name is required')
    if (owner.mode === 'pick' && !v.sub_admin) return setError('Pick the sub admin who owns this agency')
    if (!v.email || !v.email.includes('@')) return setError("The agency's login needs a valid email")
    if (v.password && v.password !== v.confirm_password) return setError('Passwords do not match')

    setBusy(true)
    let agencyId = createdId
    try {
      if (!agencyId) {
        const row = owner.mode === 'self'
          ? await createSubAdminAgency({ name: v.name, country: v.country })
          : await createCountryAgency({ name: v.name, country: v.country, subAdmin: v.sub_admin })
        agencyId = row.id
        setCreatedId(agencyId)
      }
      const res = await inviteStaff({
        email: v.email, role: 'agency_manager', agency_id: agencyId,
        full_name: v.full_name || null, username: v.username || null, phone: v.phone || null,
        location: v.country || null, password: v.password || null,
      })
      setResult(res)
    } catch (e) {
      setError(agencyId
        ? `"${v.name}" was created, but its login could not be: ${e.message || 'unknown error'}. Fix the details and press Save to retry just the login.`
        : (e.message || 'Could not create the agency'))
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <>
        <PageHeader title={title} crumbs={[...crumbRoot, title]} />
        <Card><div className="card__body">
          <EmptyState
            icon="checkCircle"
            title={`${v.name} created`}
            text={`${result.email} is now the agency's login and signs in on the Agency panel${result.temp_password ? ` with the temporary password: ${result.temp_password} — share it over a secure channel.` : ' with the password you set.'} The agency stays Pending until a platform admin approves it and sets its commission.`}
          />
          <div className="center mt-16"><Button variant="primary" onClick={() => nav(backTo)}>Back to list</Button></div>
        </div></Card>
      </>
    )
  }

  const noOwners = owner.mode === 'pick' && owners && !owners.length
  return (
    <>
      <PageHeader title={title} crumbs={[...crumbRoot, title]} actions={<Button icon="chevronLeft" onClick={() => nav(backTo)}>Back</Button>} />
      <Card
        title="Agency"
        foot={
          <div className="hstack" style={{ justifyContent: 'flex-end' }}>
            <Button variant="primary" icon={busy ? 'refresh' : 'check'} disabled={busy || noOwners} onClick={submit}>
              {busy ? 'Saving…' : createdId ? 'Retry login' : 'Save'}
            </Button>
          </div>
        }
      >
        {error && (
          <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14, whiteSpace: 'normal' }}>{error}</div>
        )}
        {noOwners && (
          <div className="badge badge--warning" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14, whiteSpace: 'normal' }}>
            There are no sub admins to own an agency yet — create a Sub Admin first.
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label>Agency name <span className="req">*</span></label>
            <input className="input" value={v.name} disabled={!!createdId} onChange={(e) => set('name', e.target.value)} placeholder="Enter agency name" />
          </div>
          <div className="field">
            <label>Region</label>
            <input className="input" value={v.country} disabled={!!createdId} onChange={(e) => set('country', e.target.value)} placeholder="India" />
          </div>
          {owner.mode === 'pick' && (
            <div className="field">
              <label>Owned by sub admin <span className="req">*</span></label>
              <select className="select" value={v.sub_admin} disabled={!!createdId} onChange={(e) => set('sub_admin', e.target.value)}>
                <option value="">Select…</option>
                {(owners || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <h4 style={{ margin: '22px 0 12px', fontSize: 13.5 }}>Agency login</h4>
        <div className="form-grid">
          <div className="field">
            <label>Manager name</label>
            <input className="input" value={v.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Enter name" />
          </div>
          <div className="field">
            <label>Username</label>
            <input className="input" value={v.username} onChange={(e) => set('username', e.target.value)} placeholder="Enter username" />
          </div>
          <div className="field">
            <label>Email <span className="req">*</span></label>
            <input className="input" type="email" value={v.email} onChange={(e) => set('email', e.target.value)} placeholder="Enter email" />
          </div>
          <div className="field">
            <label>Phone</label>
            <input className="input" value={v.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Enter phone" />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={v.password} onChange={(e) => set('password', e.target.value)} placeholder="Leave blank to auto-generate" />
          </div>
          <div className="field">
            <label>Confirm Password</label>
            <input className="input" type="password" value={v.confirm_password} onChange={(e) => set('confirm_password', e.target.value)} placeholder="Confirm Password" />
          </div>
        </div>
      </Card>
    </>
  )
}
