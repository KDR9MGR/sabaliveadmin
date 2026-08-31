import { useState } from 'react'
import { ListPage, StatGrid } from './_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, Badge, KV, useToast } from '../components/ui.jsx'
import { personCol, statusCol, numCol } from '../components/cells.jsx'
import DataTable from '../components/DataTable.jsx'
import EntityForm from '../components/EntityForm.jsx'
import { AreaChart, BarChart } from '../components/charts.jsx'
import Icon from '../components/Icon.jsx'
import PanelChip from '../components/PanelChip.jsx'
import { dashboard, hosts, hostApplications, assignments, subAdmins, salary, num } from '../data/index.js'
import { boldMd } from '../data/util.js'

const AGY = 'StarConnect'
const myHosts = hosts.filter((_, i) => i % 2 === 0).map((h) => ({ ...h, agency: AGY }))
const CR = ['Home', 'Agency']

/* ------------------------------------------------------------------ Dashboard */
export function AgencyDashboard() {
  const d = dashboard.agency
  return (
    <>
      <PageHeader
        title={<>Dashboard <PanelChip panel="agency" /></>}
        crumbs={[...CR, 'Dashboard']}
        actions={<Button variant="primary" icon="plus" iconRight="chevronDown">Quick Actions</Button>}
      />
      <div className="banner" style={{ marginBottom: 16 }}>
        <h3>Welcome back, {AGY}</h3>
        <p>You manage {myHosts.length} hosts · 11 live now · next payout Mon 02 Sep</p>
      </div>
      <StatGrid stats={d.stats} />
      <div className="grid dash mt-16">
        <Card title="Coins earned" sub="Last 30 days, all hosts">
          <AreaChart series={d.coinSeries} color="#22a06b" height={240} label="Coins (K)" />
        </Card>
        <Card title="Recent activity">
          <div className="feed">
            {d.activities.map((a, i) => (
              <div className="feed__item" key={i}>
                <span className="feed__dot"><Icon name={a.icon} size={14} /></span>
                <div><div className="feed__text" dangerouslySetInnerHTML={{ __html: boldMd(a.text) }} /><div className="feed__time">{a.time}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Top hosts this month" className="mt-16" flush>
        <table className="mini-table" style={{ margin: 12 }}>
          <thead><tr><th>#</th><th>Host</th><th>Live hrs</th><th className="right">Coins</th></tr></thead>
          <tbody>
            {d.hostPerf.map((h, i) => (
              <tr key={h.name}>
                <td><span className="rank">{i + 1}</span></td>
                <td><Person name={h.name} size="sm" /></td>
                <td>{h.hours}</td>
                <td className="right mono">{num(h.coins)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ My Agency */
export function MyAgency() {
  const toast = useToast()
  return (
    <>
      <PageHeader title="My Agency" crumbs={[...CR, 'My Agency']}
        actions={<Button variant="primary" icon="check" onClick={() => toast('Agency profile saved')}>Save</Button>} />
      <div className="grid dash">
        <Card title="Agency profile">
          <div className="form-grid">
            <div className="field"><label>Agency name</label><input className="input" defaultValue={AGY} /></div>
            <div className="field"><label>Agency ID</label><input className="input" defaultValue="AGN120" disabled /></div>
            <div className="field"><label>Manager</label><input className="input" defaultValue="Rohit Mehra" /></div>
            <div className="field"><label>Manager email</label><input className="input" defaultValue="rohit@starconnect.io" /></div>
            <div className="field"><label>Support phone</label><input className="input" defaultValue="+91 98111 22334" /></div>
            <div className="field"><label>Region</label><input className="input" defaultValue="Mumbai" /></div>
            <div className="field full"><label>About</label><textarea className="textarea" defaultValue="Talent agency focused on music & variety live creators." /></div>
          </div>
        </Card>
        <div className="vstack" style={{ gap: 16 }}>
          <Card title="Plan & commission">
            <KV rows={[
              ['Commission plan', <Tag role>Growth</Tag>],
              ['Base rate', '18%'],
              ['Bonus tier', '+2% over ₹1L'],
              ['Contract ends', '31 Mar 2027'],
            ]} />
          </Card>
          <Card title="This month">
            <div className="kpi-row">
              <div className="kpi"><div className="k">Revenue</div><div className="v">₹4.82L</div></div>
              <div className="kpi"><div className="k">Your share</div><div className="v">₹86.7K</div></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Hosts */
export function AgencyHosts() {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader title="Host Management" crumbs={[...CR, 'Hosts']}
        actions={<Button variant="primary" icon="userPlus" onClick={() => setAdding(true)}>Invite Host</Button>} />
      <DataTable
        rows={myHosts}
        searchKeys={['name', 'email', 'id']}
        tabs={[
          { label: 'All', value: 'all', filter: () => true },
          { label: 'Live', value: 'l', filter: (r) => r.status === 'Live' },
          { label: 'Inactive', value: 'i', filter: (r) => r.status === 'Inactive' },
        ]}
        filters={[{ label: 'Tier', options: ['Bronze', 'Silver', 'Gold', 'Platinum'], get: (r) => r.tier }]}
        columns={[
          personCol('name', 'email'),
          { key: 'tier', header: 'Tier', render: (r) => <Tag>{r.tier}</Tag> },
          numCol('followers', 'Followers'),
          numCol('coins', 'Coins'),
          numCol('liveHours', 'Live hrs'),
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Open profile', icon: 'eye', onClick: () => toast(`Open ${r.id}`) },
          { label: 'Message', icon: 'mail', onClick: () => toast('Message host') },
          { label: 'Set target', icon: 'flag', onClick: () => toast('Target set') },
          { sep: true },
          { label: 'Request transfer out', icon: 'arrowLeftRight', onClick: () => toast('Transfer requested') },
        ]}
      />
      {adding && (
        <EntityForm title="Invite Host" onClose={() => setAdding(false)} savedMessage="Invite sent"
          fields={[
            { name: 'name', label: 'Host name', required: true },
            { name: 'email', label: 'Email / phone', required: true },
            { name: 'tier', label: 'Starting tier', type: 'select', options: ['Bronze', 'Silver'] },
            { name: 'note', label: 'Personal note', type: 'textarea', full: true },
          ]}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Host Profiles */
export function AgencyHostProfiles() {
  const toast = useToast()
  return (
    <ListPage
      title="Host Profiles"
      crumbs={[...CR, 'Host Profiles']}
      rows={myHosts}
      searchKeys={['name', 'id']}
      columns={[
        personCol('name', 'id'),
        { key: 'bio', header: 'Bio', render: () => <span className="muted">Music • Variety • Nightly 8–11pm</span> },
        { key: 'verified', header: 'Verified', render: (r) => <Badge tone={r.tier !== 'Bronze' ? 'success' : 'muted'}>{r.tier !== 'Bronze' ? 'Verified' : 'No'}</Badge> },
        { key: 'rating', header: 'Rating', align: 'right' },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Edit profile', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
        { label: 'Manage frames & badges', icon: 'frame', onClick: () => toast('Cosmetics') },
        { label: 'Update schedule', icon: 'calendar', onClick: () => toast('Schedule') },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Applications */
export function AgencyApplications() {
  const toast = useToast()
  const rows = hostApplications.slice(0, 10)
  return (
    <ListPage
      title="Host Applications"
      crumbs={[...CR, 'Applications']}
      rows={rows}
      searchKeys={['applicant', 'email', 'id']}
      tabs={[
        { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' || r.status === 'Under Review' },
        { label: 'Approved', value: 'a', filter: (r) => r.status === 'Approved' },
        { label: 'All', value: 'all', filter: () => true },
      ]}
      columns={[
        personCol('applicant', 'email'),
        { key: 'experience', header: 'Experience', render: (r) => <Tag>{r.experience}</Tag> },
        numCol('followersOtherApps', 'Ext. followers'),
        { key: 'submitted', header: 'Submitted' },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Review', icon: 'eye', onClick: () => toast(`Review ${r.id}`) },
        { label: 'Approve', icon: 'check', onClick: () => toast(`${r.applicant} approved`) },
        { label: 'Reject', icon: 'x', onClick: () => toast('Rejected') },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Assignments */
export function AgencyAssignments() {
  const toast = useToast()
  return (
    <ListPage
      title="Assignments"
      crumbs={[...CR, 'Assignments']}
      actions={<Button variant="primary" icon="userCheck" onClick={() => toast('New assignment')}>New Assignment</Button>}
      rows={assignments}
      searchKeys={['host', 'subAdmin', 'id']}
      filters={[
        { label: 'Shift', options: ['Morning', 'Evening', 'Night', 'Flexible'], get: (r) => r.shift },
        { label: 'Status', options: ['On Track', 'Behind', 'Exceeded'], get: (r) => r.status },
      ]}
      columns={[
        personCol('host', 'id'),
        { key: 'subAdmin', header: 'Sub Admin', render: (r) => <Person name={r.subAdmin} size="sm" /> },
        { key: 'shift', header: 'Shift', render: (r) => <Tag>{r.shift}</Tag> },
        { key: 'progress', header: 'Hours', render: (r) => (
          <div style={{ minWidth: 140 }}>
            <div className="hstack spread" style={{ fontSize: 11, marginBottom: 4 }}><span>{r.doneHours}h</span><span className="muted">/ {r.targetHours}h</span></div>
            <div className="progress"><span style={{ width: Math.min(100, (r.doneHours / r.targetHours) * 100) + '%' }} /></div>
          </div>
        ) },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Reassign', icon: 'arrowLeftRight', onClick: () => toast('Reassigned') },
        { label: 'Adjust target', icon: 'flag', onClick: () => toast('Target updated') },
        { label: 'End assignment', icon: 'x', onClick: () => toast('Ended') },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Sub Admins */
export function AgencySubAdmins() {
  const toast = useToast()
  const rows = subAdmins.slice(0, 6).map((s) => ({ ...s, assignedAgency: AGY }))
  return (
    <ListPage
      title="Sub Admins"
      crumbs={[...CR, 'Sub Admins']}
      actions={<Button variant="primary" icon="userPlus" onClick={() => toast('Add sub admin')}>Add Sub Admin</Button>}
      rows={rows}
      searchKeys={['name', 'email', 'id']}
      columns={[
        personCol('name', 'email'),
        { key: 'permissions', header: 'Scope', render: (r) => <Tag>{r.permissions}</Tag> },
        numCol('hostsManaged', 'Hosts'),
        { key: 'lastLogin', header: 'Last login' },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Edit scope', icon: 'shieldUser', onClick: () => toast(`Scope for ${r.name}`) },
        { label: 'Assign hosts', icon: 'video', onClick: () => toast('Assign hosts') },
        { sep: true },
        { label: 'Remove', icon: 'trash', onClick: () => toast('Removed') },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Statistics */
export function AgencyStats() {
  return (
    <>
      <PageHeader title="Statistics" crumbs={[...CR, 'Statistics']} actions={<Button icon="download">Export</Button>} />
      <StatGrid stats={[
        { key: 'Total live hours (Aug)', value: '3,240', icon: 'radio', tile: 'tile-pink' },
        { key: 'Avg. coins / host', value: '48,900', icon: 'coins', tile: 'tile-orange' },
        { key: 'New hosts (Aug)', value: '6', icon: 'userPlus', tile: 'tile-green' },
        { key: 'Host retention (30d)', value: '82%', icon: 'userCheck', tile: 'tile-blue' },
      ]} />
      <div className="grid cols-2 mt-16">
        <Card title="Coins by host (top 6)">
          <BarChart series={dashboard.agency.hostPerf.map((h) => Math.round(h.coins / 1000))} categories={dashboard.agency.hostPerf.map((h) => h.name.split(' ')[0])} color="#7c3aed" height={240} label="Coins (K)" horizontal />
        </Card>
        <Card title="Live hours trend" sub="Weekly">
          <AreaChart series={[620, 660, 700, 740, 780, 810, 840, 880]} color="#22a06b" height={240} label="Hours" />
        </Card>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Earnings */
export function AgencyEarnings() {
  const toast = useToast()
  const rows = myHosts.map((h) => ({
    id: h.id, host: h.name, coins: h.coins, diamonds: h.diamonds,
    gross: Math.round(h.diamonds * 0.6), share: Math.round(h.diamonds * 0.6 * 0.18), status: h.status === 'Banned' ? 'On Hold' : 'Cleared',
  }))
  return (
    <>
      <PageHeader title="Earnings" crumbs={[...CR, 'Earnings']} actions={<Button icon="download">Statement</Button>} />
      <StatGrid stats={[
        { key: 'Gross (Aug)', value: '₹' + num(rows.reduce((s, r) => s + r.gross, 0)), icon: 'dollar', tile: 'tile-green' },
        { key: 'Agency share', value: '₹' + num(rows.reduce((s, r) => s + r.share, 0)), icon: 'wallet', tile: 'tile-purple' },
        { key: 'Pending clearance', value: '₹' + num(rows.filter((r) => r.status === 'On Hold').reduce((s, r) => s + r.share, 0)), icon: 'clock', tile: 'tile-orange' },
        { key: 'Next payout', value: 'Mon 02 Sep', icon: 'calendar', tile: 'tile-blue' },
      ]} />
      <div className="mt-16">
        <DataTable
          rows={rows}
          searchKeys={['host', 'id']}
          filters={[{ label: 'Status', options: ['Cleared', 'On Hold'], get: (r) => r.status }]}
          columns={[
            personCol('host', 'id'),
            numCol('coins', 'Coins'),
            numCol('diamonds', 'Diamonds'),
            numCol('gross', 'Gross', { prefix: '₹' }),
            numCol('share', 'Agency share', { prefix: '₹' }),
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Payslip', icon: 'fileText', onClick: () => toast(`Payslip ${r.id}`) },
            { label: 'Raise dispute', icon: 'flag', onClick: () => toast('Dispute raised') },
          ]}
        />
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Salary (agency view) */
export function AgencySalary() {
  const toast = useToast()
  const rows = salary.filter((_, i) => i % 2 === 0).map((r) => ({ ...r, agency: AGY }))
  return (
    <ListPage
      title="Salary"
      crumbs={[...CR, 'Salary']}
      actions={<Button variant="primary" icon="wallet" onClick={() => toast('Payout requested from platform')}>Request Payout</Button>}
      rows={rows}
      searchKeys={['payee', 'id']}
      tabs={[
        { label: 'All', value: 'all', filter: () => true },
        { label: 'Paid', value: 'p', filter: (r) => r.status === 'Paid' },
        { label: 'On Hold', value: 'h', filter: (r) => r.status === 'On Hold' },
      ]}
      columns={[
        personCol('payee', 'role'),
        { key: 'period', header: 'Period' },
        numCol('base', 'Base', { prefix: '₹' }),
        numCol('bonus', 'Bonus', { prefix: '₹' }),
        numCol('net', 'Net', { prefix: '₹' }),
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'View payslip', icon: 'fileText', onClick: () => toast(`Payslip ${r.id}`) },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Agency Account */
export function AgencyAccount() {
  const toast = useToast()
  return (
    <>
      <PageHeader title="Agency Account" crumbs={[...CR, 'Account']} />
      <div className="grid dash">
        <Card title="Payout account">
          <div className="form-grid">
            <div className="field"><label>Account holder</label><input className="input" defaultValue="StarConnect Media LLP" /></div>
            <div className="field"><label>Account type</label><input className="input" defaultValue="Current" /></div>
            <div className="field"><label>Bank</label><input className="input" defaultValue="HDFC Bank" /></div>
            <div className="field"><label>Account number</label><input className="input" defaultValue="•••• •••• 4821" /></div>
            <div className="field"><label>IFSC</label><input className="input" defaultValue="HDFC0001234" /></div>
            <div className="field"><label>PAN</label><input className="input" defaultValue="AABCS1234C" /></div>
          </div>
          <div className="hstack mt-16" style={{ justifyContent: 'flex-end' }}>
            <Button variant="primary" icon="check" onClick={() => toast('Bank details submitted for verification')}>Save & verify</Button>
          </div>
        </Card>
        <div className="vstack" style={{ gap: 16 }}>
          <Card title="Verification">
            <KV rows={[
              ['KYC status', <StatusBadge value="Verified" />],
              ['GST', <StatusBadge value="Verified" />],
              ['Agreement', <StatusBadge value="Verified" />],
              ['Bank', <StatusBadge value="Pending" />],
            ]} />
          </Card>
          <Card title="Danger zone">
            <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>Closing the agency releases all hosts back to the platform pool.</p>
            <Button variant="danger" icon="trash" onClick={() => toast('Request sent to platform admin')}>Request account closure</Button>
          </Card>
        </div>
      </div>
    </>
  )
}
