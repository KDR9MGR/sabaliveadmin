import { useParams } from 'react-router-dom'
import { ListPage, StatGrid } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, Badge, KV, useToast } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import { AreaChart } from '../../components/charts.jsx'
import Icon from '../../components/Icon.jsx'
import { hosts, hostApplications } from '../../data/index.js'
import { AGENCIES } from '../../data/util.js'

const CRUMBS = ['Home', 'Host Management']

export function HostsMgmt() {
  const toast = useToast()
  return (
    <ListPage
      title="Host Management"
      crumbs={[...CRUMBS, 'Hosts']}
      actions={<>
        <Button icon="download">Export</Button>
        <Button variant="primary" icon="plus" onClick={() => toast('Add host')}>Add Host</Button>
      </>}
      rows={hosts}
      searchKeys={['name', 'email', 'agency', 'id']}
      searchPlaceholder="Search hosts…"
      tabs={[
        { label: 'All', value: 'all', filter: () => true },
        { label: 'Live', value: 'l', filter: (r) => r.status === 'Live' },
        { label: 'Platinum', value: 'p', filter: (r) => r.tier === 'Platinum' },
        { label: 'Banned', value: 'b', filter: (r) => r.status === 'Banned' },
      ]}
      filters={[
        { label: 'Agency', options: AGENCIES, get: (r) => r.agency },
        { label: 'Tier', options: ['Bronze', 'Silver', 'Gold', 'Platinum'], get: (r) => r.tier },
        { label: 'Status', options: ['Active', 'Live', 'Inactive', 'Banned'], get: (r) => r.status },
      ]}
      columns={[
        personCol('name', 'email'),
        { key: 'agency', header: 'Agency', sortable: true },
        { key: 'tier', header: 'Tier', render: (r) => <Tag>{r.tier}</Tag> },
        numCol('followers', 'Followers'),
        numCol('coins', 'Coins'),
        numCol('diamonds', 'Diamonds'),
        numCol('liveHours', 'Live hrs'),
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'View', icon: 'eye', onClick: () => toast(`Open ${r.id}`) },
        { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.id}`) },
        { label: 'Reassign agency', icon: 'arrowLeftRight', onClick: () => toast('Reassign') },
        { label: 'Adjust tier', icon: 'award', onClick: () => toast('Tier updated') },
        { sep: true },
        { label: r.status === 'Banned' ? 'Unban' : 'Ban', icon: 'lock', onClick: () => toast(`${r.name} toggled`) },
      ]}
    />
  )
}

export function HostAssignment() {
  const toast = useToast()
  const rows = hosts.map((h) => ({
    ...h,
    subAdmin: ['Neha Verma', 'Rohit Bose', 'Kavya Iyer', 'Manish Das', 'Unassigned'][h.followers % 5],
  }))
  return (
    <ListPage
      title="Host Assignment"
      crumbs={[...CRUMBS, 'Assignment']}
      actions={<Button variant="primary" icon="userCheck" onClick={() => toast('Bulk assign')}>Bulk Assign</Button>}
      rows={rows}
      searchKeys={['name', 'agency', 'subAdmin', 'id']}
      tabs={[
        { label: 'All', value: 'all', filter: () => true },
        { label: 'Unassigned', value: 'u', filter: (r) => r.subAdmin === 'Unassigned' },
      ]}
      filters={[{ label: 'Agency', options: AGENCIES, get: (r) => r.agency }]}
      columns={[
        personCol('name', 'id'),
        { key: 'agency', header: 'Agency', sortable: true },
        { key: 'subAdmin', header: 'Sub Admin', render: (r) => r.subAdmin === 'Unassigned' ? <Badge tone="warning">Unassigned</Badge> : <Person name={r.subAdmin} size="sm" /> },
        numCol('liveHours', 'Live hrs'),
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Assign sub admin', icon: 'shieldUser', onClick: () => toast(`Assign for ${r.name}`) },
        { label: 'Change agency', icon: 'arrowLeftRight', onClick: () => toast('Change agency') },
        { label: 'Unassign', icon: 'x', onClick: () => toast('Unassigned') },
      ]}
    />
  )
}

export function HostApplications() {
  const toast = useToast()
  return (
    <ListPage
      title="Host Applications"
      crumbs={[...CRUMBS, 'Applications']}
      rows={hostApplications}
      searchKeys={['applicant', 'email', 'agency', 'id']}
      tabs={[
        { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
        { label: 'Under Review', value: 'r', filter: (r) => r.status === 'Under Review' },
        { label: 'Approved', value: 'a', filter: (r) => r.status === 'Approved' },
        { label: 'Rejected', value: 'x', filter: (r) => r.status === 'Rejected' },
        { label: 'All', value: 'all', filter: () => true },
      ]}
      columns={[
        personCol('applicant', 'email'),
        { key: 'agency', header: 'Applying via', sortable: true },
        { key: 'experience', header: 'Experience', render: (r) => <Tag>{r.experience}</Tag> },
        numCol('followersOtherApps', 'Ext. followers'),
        { key: 'submitted', header: 'Submitted' },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Review', icon: 'eye', onClick: () => toast(`Review ${r.id}`) },
        { label: 'Approve', icon: 'check', onClick: () => toast(`${r.applicant} approved`) },
        { label: 'Reject', icon: 'x', onClick: () => toast(`${r.applicant} rejected`) },
      ]}
    />
  )
}

export function HostDetail() {
  const { id } = useParams()
  const toast = useToast()
  const h = hosts.find((x) => x.id === id) || hosts[0]
  return (
    <>
      <PageHeader
        title={h.name}
        crumbs={['Home', 'Host Management', 'Hosts', h.id]}
        actions={<>
          <Button icon="chevronLeft" onClick={() => history.back()}>Back</Button>
          <Button icon="arrowLeftRight" onClick={() => toast('Transfer host')}>Transfer</Button>
          <Button variant="danger" icon="lock" onClick={() => toast(`${h.name} banned`)}>Ban</Button>
        </>}
      />
      <StatGrid stats={[
        { key: 'Followers', value: h.followers.toLocaleString(), icon: 'users', tile: 'tile-purple' },
        { key: 'Coins earned', value: h.coins.toLocaleString(), icon: 'coins', tile: 'tile-orange' },
        { key: 'Diamonds', value: h.diamonds.toLocaleString(), icon: 'star', tile: 'tile-blue' },
        { key: 'Live hours', value: String(h.liveHours), icon: 'radio', tile: 'tile-pink' },
      ]} />
      <div className="grid dash mt-16">
        <Card title="Earnings (30 days)">
          <AreaChart series={[12, 18, 15, 22, 20, 28, 25, 33, 30, 38, 35, 44, 40, 50, 48, 58, 55, 63, 60, 70, 66, 75, 72, 82, 78, 88, 84, 95, 90, 100]} color="#7c3aed" height={230} label="Coins (K)" />
        </Card>
        <Card title="Host info">
          <KV rows={[
            ['Host ID', <span className="mono">{h.id}</span>],
            ['Agency', h.agency],
            ['Tier', <Tag>{h.tier}</Tag>],
            ['Rating', <span className="hstack" style={{ gap: 4 }}><Icon name="star" size={13} style={{ color: '#f59e0b' }} />{h.rating}</span>],
            ['Joined', h.joined],
            ['Status', <StatusBadge value={h.status} />],
          ]} />
        </Card>
      </div>
      <Card title="Profile Management" className="mt-16">
        <div className="toggle-row"><div><div className="t-title">Discoverable</div><div className="t-desc">Appears in Explore & recommendations</div></div>
          <label className="toggle"><input type="checkbox" defaultChecked /><span className="track" /><span className="thumb" /></label></div>
        <div className="toggle-row"><div><div className="t-title">Can host PK battles</div><div className="t-desc">Enable competitive live matches</div></div>
          <label className="toggle"><input type="checkbox" defaultChecked /><span className="track" /><span className="thumb" /></label></div>
        <div className="toggle-row"><div><div className="t-title">Verified badge</div><div className="t-desc">Show verified check on profile</div></div>
          <label className="toggle"><input type="checkbox" defaultChecked={h.tier !== 'Bronze'} /><span className="track" /><span className="thumb" /></label></div>
        <div className="toggle-row"><div><div className="t-title">Auto-payout</div><div className="t-desc">Release earnings on monthly cycle</div></div>
          <label className="toggle"><input type="checkbox" /><span className="track" /><span className="thumb" /></label></div>
      </Card>
    </>
  )
}
