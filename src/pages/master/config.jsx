import { useState } from 'react'
import { PageHeader, Card, Button, useToast } from '../../components/ui.jsx'
import { useSettings, BRAND_PRESETS, DEFAULT_SETTINGS } from '../../config/settings.jsx'
import Icon from '../../components/Icon.jsx'

/* ---- field primitives ---- */
function Text({ label, hint, value, ...rest }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input className="input" defaultValue={value} {...rest} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

/* live-bound dashboard name — edits update the sidebar / title everywhere at once */
function BrandNameField() {
  const { settings, update } = useSettings()
  return (
    <div className="field">
      <label>Dashboard name</label>
      <input className="input" value={settings.appName} onChange={(e) => update({ appName: e.target.value })} />
      <span className="hint">Shown in the sidebar, the browser tab and the sign-in screen — updates live.</span>
    </div>
  )
}

function BrandingSection() {
  const { settings, update, reset } = useSettings()
  return (
    <div className="form-grid">
      <BrandNameField />
      <div className="field">
        <label>Tagline</label>
        <input className="input" value={settings.tagline} onChange={(e) => update({ tagline: e.target.value })} />
        <span className="hint">Small text under the name on the sign-in screen.</span>
      </div>

      <div className="field full">
        <label>Brand colour</label>
        <div className="hstack wrap" style={{ gap: 10 }}>
          <input
            type="color" className="color-input"
            value={settings.brandColor}
            onChange={(e) => update({ brandColor: e.target.value })}
          />
          <input
            className="input" style={{ width: 130 }}
            value={settings.brandColor}
            onChange={(e) => update({ brandColor: e.target.value })}
          />
          <div className="hstack wrap" style={{ gap: 6 }}>
            {BRAND_PRESETS.map((p) => (
              <button
                key={p.value} title={p.name}
                onClick={() => update({ brandColor: p.value })}
                className="swatch"
                style={{ background: p.value, outline: settings.brandColor.toLowerCase() === p.value ? '2px solid var(--text)' : 'none' }}
              />
            ))}
          </div>
        </div>
        <span className="hint">Recolours buttons, links, charts and highlights across every panel — instantly.</span>
      </div>

      <div className="field full">
        <label>Sidebar style</label>
        <div className="pill-tabs">
          {['light', 'dark'].map((s) => (
            <button key={s} className={settings.sidebarStyle === s ? 'active' : ''} onClick={() => update({ sidebarStyle: s })}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <span className="hint">The Super Admin panel always uses a dark sidebar so it’s never mistaken for the others.</span>
      </div>

      <div className="full">
        <div className="toggle-row">
          <div><div className="t-title">Compact tables</div><div className="t-desc">Tighter row spacing in every data table</div></div>
          <label className="toggle">
            <input type="checkbox" checked={settings.denseTables} onChange={(e) => update({ denseTables: e.target.checked })} />
            <span className="track" /><span className="thumb" />
          </label>
        </div>
      </div>

      <div className="full">
        <div className="card" style={{ padding: 16, background: 'var(--surface-2)' }}>
          <div className="hstack spread">
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Live preview</div>
              <div className="muted" style={{ fontSize: 12 }}>Reflects the current values</div>
            </div>
            <div className="hstack" style={{ gap: 8 }}>
              <span className="badge badge--violet">{settings.appName}</span>
              <button className="btn btn--primary btn--sm">Primary button</button>
              <span className="tag tag--role">Tag</span>
            </div>
          </div>
        </div>
      </div>

      <div className="full">
        <Button icon="refresh" onClick={reset}>Reset branding to defaults ({DEFAULT_SETTINGS.appName})</Button>
      </div>
    </div>
  )
}
function Select({ label, options, value }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select className="select" defaultValue={value}>{options.map((o) => <option key={o}>{o}</option>)}</select>
    </div>
  )
}
function Toggle({ title, desc, on }) {
  return (
    <div className="toggle-row">
      <div><div className="t-title">{title}</div><div className="t-desc">{desc}</div></div>
      <label className="toggle"><input type="checkbox" defaultChecked={on} /><span className="track" /><span className="thumb" /></label>
    </div>
  )
}

/* ---- section renderers ---- */
const SECTIONS = {
  Branding: BrandingSection,
  General: () => (
    <div className="form-grid">
      <BrandNameField />
      <Text label="App version" value="3.1.0" />
      <Text label="Support email" value="support@sabalive.app" />
      <Text label="Contact number" value="+91 98765 43210" />
      <Select label="Default timezone" value="(UTC +05:30) Asia/Kolkata" options={['(UTC +05:30) Asia/Kolkata', '(UTC +00:00) UTC', '(UTC -05:00) America/New_York', '(UTC +04:00) Asia/Dubai']} />
      <Select label="Default currency" value="INR (₹)" options={['INR (₹)', 'USD ($)', 'EUR (€)', 'AED (د.إ)']} />
      <Select label="Default language" value="English" options={['English', 'Hindi', 'Arabic', 'Spanish']} />
      <Text label="Min supported build (Android / iOS)" value="310 / 310" />
      <div className="full" style={{ marginTop: 4 }}>
        <Toggle title="Maintenance mode" desc="Show a maintenance screen to all users except admins" />
        <Toggle title="Allow new registrations" desc="Users can create accounts from the app" on />
        <Toggle title="Force update" desc="Block app usage below the min supported build" />
      </div>
    </div>
  ),
  Live: () => (
    <div className="form-grid">
      <Text label="Max live duration (minutes)" value="240" />
      <Text label="Max viewers per room" value="20000" />
      <Text label="PK battle duration (seconds)" value="300" />
      <Text label="Min level to go live" value="3" />
      <Select label="Video provider" value="Agora" options={['Agora', 'ZEGOCLOUD', 'Custom RTMP']} />
      <Select label="Default stream quality" value="720p" options={['480p', '720p', '1080p']} />
      <div className="full" style={{ marginTop: 4 }}>
        <Toggle title="Auto-record live sessions" desc="Store recordings for 30 days for moderation" on />
        <Toggle title="Allow multi-guest rooms" desc="Up to 9 hosts in a single room" on />
        <Toggle title="Profanity auto-mute" desc="Mute hosts on repeated flagged phrases" on />
        <Toggle title="Beauty filters" desc="Enable on-device beautification" on />
      </div>
    </div>
  ),
  Payment: () => (
    <div className="form-grid">
      <Select label="Primary gateway" value="Razorpay" options={['Razorpay', 'Stripe', 'PayU', 'Cashfree']} />
      <Select label="Fallback gateway" value="Cashfree" options={['None', 'Cashfree', 'Stripe', 'PayU']} />
      <Text label="Platform fee on recharge (%)" value="0" />
      <Text label="GST / tax (%)" value="18" />
      <Text label="Coin conversion (₹ per coin)" value="1.00" />
      <Text label="Min recharge (₹)" value="10" />
      <div className="full" style={{ marginTop: 4 }}>
        <Toggle title="Enable UPI" desc="Accept UPI collect & intent payments" on />
        <Toggle title="Enable cards" desc="Domestic & international cards" on />
        <Toggle title="Enable in-app purchases" desc="Google Play & App Store billing" on />
        <Toggle title="Sandbox mode" desc="Route all payments to test environment" />
      </div>
    </div>
  ),
  Notification: () => (
    <div className="form-grid">
      <Select label="Push provider" value="Firebase (FCM)" options={['Firebase (FCM)', 'OneSignal', 'APNs direct']} />
      <Text label="Daily push cap per user" value="6" />
      <Text label="Quiet hours" value="23:00 – 07:00" />
      <Select label="Email provider" value="Amazon SES" options={['Amazon SES', 'SendGrid', 'Postmark']} />
      <div className="full" style={{ marginTop: 4 }}>
        <Toggle title="Followed host goes live" desc="Notify followers when a host starts a stream" on />
        <Toggle title="Gift received" desc="Notify hosts on incoming gifts" on />
        <Toggle title="Wallet & payout updates" desc="Recharge success, payout processed" on />
        <Toggle title="Marketing & offers" desc="Promotional campaigns (respects opt-out)" />
      </div>
    </div>
  ),
  KYC: () => (
    <div className="form-grid">
      <Select label="KYC provider" value="Sumsub" options={['Sumsub', 'HyperVerge', 'IDfy', 'Manual only']} />
      <Select label="Required for" value="Hosts & withdrawals" options={['Hosts only', 'Hosts & withdrawals', 'All users']} />
      <Text label="Min age" value="18" />
      <Text label="Re-verification interval (months)" value="24" />
      <Select label="Accepted documents" value="Aadhaar, PAN, Passport" options={['Aadhaar, PAN, Passport', 'PAN only', 'Government ID + Selfie']} />
      <Text label="Auto-approve threshold (score)" value="0.85" />
      <div className="full" style={{ marginTop: 4 }}>
        <Toggle title="Liveness / selfie check" desc="Require a live selfie during verification" on />
        <Toggle title="Manual review for premium payouts" desc="Payouts above ₹50,000 need human approval" on />
        <Toggle title="Block withdrawals until verified" desc="No payout requests before KYC is approved" on />
      </div>
    </div>
  ),
  Withdrawal: () => (
    <div className="form-grid">
      <Text label="Min withdrawal (₹)" value="500" />
      <Text label="Max withdrawal per day (₹)" value="100000" />
      <Text label="Diamond → ₹ rate" value="0.60" />
      <Text label="Processing fee (%)" value="2" />
      <Select label="Payout cycle" value="Weekly (Mon)" options={['Daily', 'Weekly (Mon)', 'Bi-weekly', 'Monthly (1st)']} />
      <Select label="Payout rail" value="RazorpayX" options={['RazorpayX', 'Cashfree Payouts', 'Manual bank transfer']} />
      <div className="full" style={{ marginTop: 4 }}>
        <Toggle title="Auto-approve under threshold" desc="Requests below ₹10,000 process automatically" on />
        <Toggle title="Hold period" desc="72-hour hold on first withdrawal per account" on />
        <Toggle title="Allow agency-managed payouts" desc="Agencies disburse to their own hosts" on />
      </div>
    </div>
  ),
  Security: () => (
    <div className="form-grid">
      <Select label="Admin session timeout" value="30 minutes" options={['15 minutes', '30 minutes', '1 hour', '4 hours']} />
      <Text label="Max login attempts" value="5" />
      <Text label="Password min length" value="10" />
      <Select label="2FA enforcement" value="All admins" options={['Optional', 'All admins', 'Super Admin only']} />
      <Text label="Allowed admin IP ranges" value="Any" hint="CIDR list, comma separated" />
      <Text label="API rate limit (req/min)" value="600" />
      <div className="full" style={{ marginTop: 4 }}>
        <Toggle title="Force password rotation" desc="Admins must reset password every 90 days" on />
        <Toggle title="Audit logging" desc="Record every admin write action" on />
        <Toggle title="Device binding" desc="Bind admin sessions to a trusted device" />
        <Toggle title="Block rooted / jailbroken devices" desc="Deny app access on compromised OS" on />
      </div>
    </div>
  ),
}

const KEYS = Object.keys(SECTIONS)

export default function ApplicationConfig({ crumbRoot = 'Application Configuration' }) {
  const [sec, setSec] = useState('Branding')
  const toast = useToast()
  const { reset } = useSettings()
  const Body = SECTIONS[sec]
  const isBranding = sec === 'Branding'
  return (
    <>
      <PageHeader
        title="Application Configuration"
        crumbs={['Home', crumbRoot, sec + ' Settings']}
        actions={<>
          <Button icon="refresh" onClick={() => { if (isBranding) { reset(); toast('Branding reset to defaults') } else toast('Reverted to saved values') }}>Reset</Button>
          <Button variant="primary" icon="check" onClick={() => toast(isBranding ? 'Branding saved' : `${sec} settings saved`)}>Save Changes</Button>
        </>}
      />
      <div className="settings-layout">
        <Card flush>
          <div className="settings-nav" style={{ padding: 10 }}>
            {KEYS.map((k) => (
              <button key={k} className={sec === k ? 'active' : ''} onClick={() => setSec(k)}>
                {k === 'Branding' ? 'Site / Branding' : `${k} Settings`}
              </button>
            ))}
          </div>
        </Card>
        <Card title={isBranding ? 'Site / Branding' : `${sec} Settings`} sub={isBranding ? 'Rename the dashboard and set the live brand colour — applies to all panels' : 'Changes apply on save and take effect within 60 seconds'}>
          <Body />
        </Card>
      </div>
    </>
  )
}
