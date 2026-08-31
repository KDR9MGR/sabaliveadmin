import { PageHeader, Card, Button, Badge } from '../../components/ui.jsx'
import Icon from '../../components/Icon.jsx'
import { StatGrid } from '../_templates.jsx'
import PanelChip from '../../components/PanelChip.jsx'
import { AreaChart, BarChart, DonutChart } from '../../components/charts.jsx'
import { dashboard, num } from '../../data/index.js'
import { boldMd } from '../../data/util.js'

const d = dashboard.master
const DAYS = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'))

export default function MasterDashboard() {
  return (
    <>
      <PageHeader
        title={<>Dashboard <PanelChip panel="master" /></>}
        crumbs={['Home', 'Dashboard']}
        actions={<>
          <Button icon="download">Export</Button>
          <Button variant="primary" icon="plus" iconRight="chevronDown">Quick Actions</Button>
        </>}
      />

      <StatGrid stats={d.stats} />

      <div className="grid dash-3 mt-16">
        <Card title="User Overview" action={<span className="tag">This Month</span>}>
          <div className="hstack" style={{ gap: 20, alignItems: 'center' }}>
            <div style={{ width: 170 }}>
              <DonutChart data={d.userSplit} centerLabel="Total Users" height={190} />
            </div>
            <div className="legend grow">
              {d.userSplit.map((s) => (
                <div className="legend__row" key={s.label}>
                  <span className="sw" style={{ background: s.color }} />
                  <span className="lbl">{s.label}</span>
                  <span className="val">{num(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Live Overview" action={<span className="tag">This Month</span>}>
          <AreaChart series={d.liveSeries} categories={DAYS} color="#7c3aed" height={210} label="Live rooms" />
        </Card>

        <Card title="Revenue (Gift Points)" action={<span className="tag">This Month</span>}>
          <BarChart series={d.revenueSeries} categories={DAYS} color="#ec4899" height={210} label="Points (K)" />
        </Card>
      </div>

      <div className="grid dash-3 mt-16">
        <Card title="Recent Activities" action={<Button variant="subtle" size="sm">View all</Button>}>
          <div className="feed">
            {d.activities.map((a, i) => (
              <div className="feed__item" key={i}>
                <span className="feed__dot"><Icon name={a.icon} size={15} /></span>
                <div>
                  <div className="feed__text" dangerouslySetInnerHTML={{ __html: boldMd(a.text) }} />
                  <div className="feed__time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top Agencies" action={<Button variant="subtle" size="sm">View all</Button>}>
          <table className="mini-table">
            <thead>
              <tr><th>#</th><th>Agency</th><th>Hosts</th><th>Users</th><th className="right">Revenue</th></tr>
            </thead>
            <tbody>
              {d.topAgencies.map((a, i) => (
                <tr key={a.name}>
                  <td><span className="rank">{i + 1}</span></td>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td>{a.hosts}</td>
                  <td>{num(a.users)}</td>
                  <td className="right mono">{num(a.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="System Alerts" action={<Button variant="subtle" size="sm">View all</Button>}>
          <div className="feed">
            {d.alerts.map((a, i) => (
              <div className="feed__item" key={i}>
                <span className="feed__dot" style={alertStyle(a.severity)}>
                  <Icon name={a.severity === 'Critical' ? 'xCircle' : a.severity === 'Warning' ? 'flag' : 'checkCircle'} size={15} />
                </span>
                <div>
                  <div className="feed__text">{a.text}</div>
                  <div className="feed__time hstack" style={{ gap: 8 }}>
                    <span>{a.time}</span>
                    <Badge tone={a.severity === 'Critical' ? 'danger' : a.severity === 'Warning' ? 'warning' : 'info'}>{a.severity}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

function alertStyle(sev) {
  if (sev === 'Critical') return { background: 'var(--danger-bg)', color: 'var(--danger)' }
  if (sev === 'Warning') return { background: 'var(--warning-bg)', color: 'var(--warning)' }
  return { background: 'var(--success-bg)', color: 'var(--success)' }
}
