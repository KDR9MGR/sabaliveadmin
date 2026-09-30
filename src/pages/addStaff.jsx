/* Shared full-page "Add Admin" form — replaces the old slide-in drawer.
   Used by Super Admin, Global Admin and Country Admin, each supplying which
   roles it may create and where to land afterwards. Calls the real
   inviteStaff() -> invite-staff Edge Function; nothing here is mocked. Which
   roles a caller may actually create is enforced server-side
   (check_staff_creation), so the options passed in are only a convenience.
     showAgency        — offer the agency field (Super's forms); Global/Country hide it
     countryAdminMode  — for a sub admin's owner: 'pick' (optional), 'require', or
                         'none' (a Country Admin's sub admins are always their own) */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, Button, EmptyState } from '../components/ui.jsx'
import { useAsyncData } from '../lib/useAsync.js'
import { inviteStaff, agencyOptions, countryAdminOptions } from '../lib/accounts.js'
import { countryList } from '../lib/countries.js'

export function AddStaffForm({ title = 'Add Admin', crumbRoot, roleOpts, backTo, showAgency = true, countryAdminMode = 'pick' }) {
  const nav = useNavigate()
  const { data: agencies } = useAsyncData(agencyOptions)
  const { data: countryAdmins } = useAsyncData(countryAdminOptions)
  const [v, setV] = useState({
    email: '', full_name: '', username: '', phone: '', location: '',
    role: roleOpts[0]?.value || '', agency_id: '', country_admin_id: '',
    password: '', confirm_password: '', payment_pin: '', confirm_payment_pin: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }))
  const needsAgency = v.role === 'agency_manager'
  const showAgencyField = showAgency && (needsAgency || v.role === 'sub_admin')
  const showCountryField = countryAdminMode !== 'none' && v.role === 'sub_admin'
  // a country is only meaningful for the country-level accounts (as in the reference forms)
  const showCountryPick = !['sub_admin', 'agency_manager'].includes(v.role)

  const submit = async () => {
    setError('')
    if (!v.email || !v.email.includes('@')) return setError('A valid email is required')
    if (needsAgency && !v.agency_id) return setError('Agency is required for this role')
    if (showCountryField && countryAdminMode === 'require' && !v.country_admin_id) return setError('Pick the Country Admin this sub admin will report to')
    if (v.password && v.password !== v.confirm_password) return setError('Passwords do not match')
    if (v.payment_pin && v.payment_pin !== v.confirm_payment_pin) return setError('Payment PINs do not match')
    setBusy(true)
    try {
      const res = await inviteStaff(v)
      setResult(res)
    } catch (e) {
      setError(e.message || 'Could not create the account')
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
            title="Account created"
            text={result.temp_password
              ? `${result.email} can sign in with the temporary password: ${result.temp_password} — share it over a secure channel.`
              : `${result.email} can sign in with the password you set.`}
          />
          <div className="center mt-16"><Button variant="primary" onClick={() => nav(backTo)}>Back to list</Button></div>
        </div></Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title={title} crumbs={[...crumbRoot, title]} actions={<Button icon="chevronLeft" onClick={() => nav(backTo)}>Back</Button>} />
      <Card
        title={title}
        foot={
          <div className="hstack" style={{ justifyContent: 'flex-end' }}>
            <Button variant="primary" icon={busy ? 'refresh' : 'check'} disabled={busy} onClick={submit}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        {error && (
          <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{error}</div>
        )}
        <div className="form-grid">
          <div className="field">
            <label>Name</label>
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
            <label>Role <span className="req">*</span></label>
            <select className="select" value={v.role} onChange={(e) => set('role', e.target.value)}>
              {roleOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {showAgencyField && (
            <div className="field">
              <label>Agency {needsAgency && <span className="req">*</span>}</label>
              <select className="select" value={v.agency_id} onChange={(e) => set('agency_id', e.target.value)}>
                <option value="">{needsAgency ? 'Select…' : 'None yet'}</option>
                {(agencies || []).map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          )}
          {showCountryField && (
            <div className="field">
              <label>Country Admin {countryAdminMode === 'require' && <span className="req">*</span>}</label>
              <select className="select" value={v.country_admin_id} onChange={(e) => set('country_admin_id', e.target.value)}>
                <option value="">{countryAdminMode === 'require' ? 'Select…' : 'None yet'}</option>
                {(countryAdmins || []).map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          )}
          {showCountryPick && (
            <div className="field">
              <label>Country</label>
              <select className="select" value={v.location} onChange={(e) => set('location', e.target.value)}>
                <option value="">Select country…</option>
                {countryList().map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={v.password} onChange={(e) => set('password', e.target.value)} placeholder="Leave blank to auto-generate" />
          </div>
          <div className="field">
            <label>Confirm Password</label>
            <input className="input" type="password" value={v.confirm_password} onChange={(e) => set('confirm_password', e.target.value)} placeholder="Confirm Password" />
          </div>
          <div className="field">
            <label>Payment PIN</label>
            <input className="input" type="password" value={v.payment_pin} onChange={(e) => set('payment_pin', e.target.value)} placeholder="4-6 digits, optional" />
          </div>
          <div className="field">
            <label>Confirm Payment PIN</label>
            <input className="input" type="password" value={v.confirm_payment_pin} onChange={(e) => set('confirm_payment_pin', e.target.value)} placeholder="Confirm Payment PIN" />
          </div>
        </div>
      </Card>
    </>
  )
}
