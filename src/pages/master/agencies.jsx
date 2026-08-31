import { useParams, useNavigate } from 'react-router-dom'
import { ListPage, StatGrid } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, KV, useToast } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import { AreaChart, BarChart } from '../../components/charts.jsx'
import { agencies, hosts, transferRequests } from '../../data/index.js'

const CRUMBS = ['Home', 'Agency Management']

export function AgencyList() {
  const nav = useNavigate()
  const toast = useToast()
  return (
    <ListPage
      title="Agency Management"
      crumbs={[...CRUMBS, 'Agencies']}
      actions={<>
        <Button icon="download">Export</Button>
        <Button variant="primary" icon="plus" onClick={() => toast('Add agency')}>Add Agency</Button>
      </>}
      rows={agencies}
      onRowClick={(r) => nav(`/admin/agencies/${r.id}`)}
      searchKeys={['name', 'manager', 'id', 'country']}
      filters={[
        { label: 'Status', options: ['Active', 'Inactive', 'Pending'], get: (r) => r.status },
        { label: 'Region', options: [...new Set(agencies.map((a) => a.country))], get: (r) => r.country },
      ]}
      columns={[
        { key: 'name', header: 'Agency Name', sortable: true, render: (r) => <Person name={r.name} meta={r.id} size="sm" /> },
        personCol('manager', 'managerEmail'),
        numCol('hosts', 'Hosts'),
        numCol('users', 'Users'),
        numCol('revenue', 'Revenue (Points)'),
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'View details', icon: 'eye', onClick: () => nav(`/admin/agencies/${r.id}`) },
        { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
        { label: 'Manage hosts', icon: 'video', onClick: () => toast('Host roster') },
        { sep: true },
        { label: r.status === 'Active' ? 'Suspend' : 'Activate', icon: 'lock', onClick: () => toast(`${r.name} toggled`) },
      ]}
    />
  )
}

export function AgencyRequests() {
  const toast = useToast()
  const rows = transferRequests.filter((r) => r.type === 'Agency').concat(
    Array.from({ length: 6 }, (_, i) => ({
      id: 'ONB' + (30 + i), type: 'Onboarding', subject: ['NewGen Media', 'CityLive', 'PeakTalent', 'MegaCast', 'UrbanGlow', 'FreshWave'][i],
      from: 'Website form', to: '—', requestedBy: 'Self', date: '2' + i + ' Aug 2026', status: i < 3 ? 'Pending' : 'Approved', reason: 'New agency application',
    }))
  )
  return (
    <ListPage
      title="Agency Requests"
      crumbs={[...CRUMBS, 'Requests']}
      rows={rows}
      searchKeys={['subject', 'requestedBy', 'id']}
      tabs={[
        { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
        { label: 'Approved', value: 'a', filter: (r) => r.status === 'Approved' },
        { label: 'All', value: 'all', filter: () => true },
      ]}
      columns={[
        { key: 'id', header: 'Request', render: (r) => <span className="mono muted">{r.id}</span> },
        { key: 'type', header: 'Type', render: (r) => <Tag>{r.type}</Tag> },
        { key: 'subject', header: 'Agency', sortable: true },
        { key: 'reason', header: 'Detail' },
        { key: 'date', header: 'Submitted', sortable: true },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Approve', icon: 'check', onClick: () => toast(`${r.id} approved`) },
        { label: 'Reject', icon: 'x', onClick: () => toast(`${r.id} rejected`) },
      ]}
    />
  )
}

export function CommissionPlans() {
  const toast = useToast()
  const plans = [
    { id: 'CP1', name: 'Standard', rate: '15%', bonus: 'None', minHosts: 5, agencies: 42, status: 'Active' },
    { id: 'CP2', name: 'Growth', rate: '18%', bonus: '+2% over ₹1L', minHosts: 15, agencies: 21, status: 'Active' },
    { id: 'CP3', name: 'Premium', rate: '22%', bonus: '+3% over ₹3L', minHosts: 40, agencies: 9, status: 'Active' },
    { id: 'CP4', name: 'Launch Partner', rate: '25%', bonus: 'Flat 3 months', minHosts: 0, agencies: 3, status: 'Inactive' },
  ]
  return (
    <ListPage
      title="Commission Plans"
      crumbs={[...CRUMBS, 'Commission Plans']}
      actions={<Button variant="primary" icon="plus" onClick={() => toast('New plan')}>New Plan</Button>}
      rows={plans}
      searchKeys={['name', 'id']}
      columns={[
        { key: 'name', header: 'Plan', sortable: true, render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
        { key: 'rate', header: 'Base rate', align: 'right' },
        { key: 'bonus', header: 'Bonus tier' },
        numCol('minHosts', 'Min hosts'),
        numCol('agencies', 'Agencies on plan'),
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
        { label: 'Assign agencies', icon: 'building', onClick: () => toast('Assign') },
        { sep: true },
        { label: 'Archive', icon: 'trash', onClick: () => toast('Archived') },
      ]}
    />
  )
}

export function AgencyDetail() {
  const { id } = useParams()
  const toast = useToast()
  const a = agencies.find((x) => x.id === id) || agencies[0]
  const roster = hosts.slice(0, 8)
  return (
    <>
      <PageHeader
        title={a.name}
        crumbs={['Home', 'Agency Management', 'Agencies', a.id]}
        actions={<>
          <Button icon="chevronLeft" onClick={() => history.back()}>Back</Button>
          <Button icon="edit" onClick={() => toast('Edit agency')}>Edit</Button>
          <Button variant="primary" icon="dollar" onClick={() => toast('Payout initiated')}>Run Payout</Button>
        </>}
      />
      <StatGrid stats={[
        { key: 'Hosts', value: String(a.hosts), icon: 'video', tile: 'tile-green' },
        { key: 'Users', value: a.users.toLocaleString(), icon: 'users', tile: 'tile-purple' },
        { key: 'Revenue (Points)', value: a.revenue.toLocaleString(), icon: 'coins', tile: 'tile-orange' },
        { key: 'Commission', value: a.commission + '%', icon: 'dollar', tile: 'tile-blue' },
      ]} />

      <div className="grid dash mt-16">
        <Card title="Revenue trend" sub="Last 30 days">
          <BarChart series={[42, 55, 38, 60, 48, 72, 65, 58, 80, 70, 92, 84, 100, 90, 110, 95, 120, 108, 130, 118, 140, 125, 150, 138, 160, 145, 170, 158, 180, 168]} color="#f59e0b" height={230} label="Points (K)" />
        </Card>
        <Card title="Agency info">
          <KV rows={[
            ['Agency ID', <span className="mono">{a.id}</span>],
            ['Manager', a.manager],
            ['Manager email', a.managerEmail],
            ['Region', a.country],
            ['Onboarded', a.joined],
            ['Status', <StatusBadge value={a.status} />],
          ]} />
        </Card>
      </div>

      <div className="spread mt-24" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 15 }}>Host roster</h3>
        <Button size="sm" icon="plus" onClick={() => toast('Add host to agency')}>Add Host</Button>
      </div>
      <DataTable
        rows={roster}
        pageSize={6}
        searchKeys={['name', 'id']}
        columns={[
          personCol('name', 'id'),
          { key: 'tier', header: 'Tier', render: (r) => <Tag>{r.tier}</Tag> },
          numCol('followers', 'Followers'),
          numCol('coins', 'Coins'),
          numCol('liveHours', 'Live hrs'),
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Open host', icon: 'eye', onClick: () => toast(`Open ${r.id}`) },
          { label: 'Transfer out', icon: 'arrowLeftRight', onClick: () => toast('Transfer') },
        ]}
      />
    </>
  )
}
