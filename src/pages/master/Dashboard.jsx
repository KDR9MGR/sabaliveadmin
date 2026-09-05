import { useEffect, useState } from 'react'
import { PageHeader, Card, Button, Badge, EmptyState } from '../../components/ui.jsx'
import Icon from '../../components/Icon.jsx'
import { StatGrid } from '../_templates.jsx'
import PanelChip from '../../components/PanelChip.jsx'
import { AreaChart, BarChart, DonutChart } from '../../components/charts.jsx'
import { fetchMasterDashboard } from '../../lib/dashboard.js'
import { boldMd } from '../../data/util.js'

const num = (n) => Number(n || 0).toLocaleString()

export default function MasterDashboard() {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    fetchMasterDashboard()
      .then((data) => { if (live) setD(data) })
      .catch((err) => { if (live) setError(err.message || 'Failed to load dashboard data') })
    return () => { live = false }
  }, [])

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

      {error && (
        <Card><div className="card__body"><EmptyState icon="xCircle" title="Couldn't load live data" text={error} /></div></Card>
      )}

      {!error && !d && (
        <div className="stat-grid">
          {Array.from({ length: 5 }, (_, i) => (
            <div className="stat" key={i} style={{ opacity: 0.5 }}>
              <div className="stat__label">Loading…</div>
              <div className="stat__value">—</div>
            </div>
          ))}
        </div>
      )}

      {d && (
        <>
          <StatGrid stats={d.stats} />

          <div className="grid dash-3 mt-16">
            <Card title="User Overview" action={<span className="tag">Live</span>}>
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

            <Card title="Live Overview" sub="Rooms started, last 30 days" action={<span className="tag">Live</span>}>
              <AreaChart series={d.liveSeries} categories={d.days} color="#7c3aed" height={210} label="Live rooms" />
            </Card>

            <Card title="Revenue (Gift Coins)" sub="Coins gifted, last 30 days" action={<span className="tag">Live</span>}>
              <BarChart series={d.revenueSeries} categories={d.days} color="#ec4899" height={210} label="Coins" />
            </Card>
          </div>

          <div className="grid dash-3 mt-16">
            <Card title="Recent Activity">
              {d.activities.length ? (
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
              ) : (
                <EmptyState icon="activity" title="Nothing yet" text="Signups, hosts going live and gifts will show up here as they happen." />
              )}
            </Card>

            <Card title="Top Agencies" sub="By coins gifted to their hosts">
              {d.topAgencies.length ? (
                <table className="mini-table">
                  <thead>
                    <tr><th>#</th><th>Agency</th><th>Hosts</th><th className="right">Coins gifted</th></tr>
                  </thead>
                  <tbody>
                    {d.topAgencies.map((a, i) => (
                      <tr key={a.name}>
                        <td><span className="rank">{i + 1}</span></td>
                        <td style={{ fontWeight: 600 }}>{a.name}</td>
                        <td>{a.hosts}</td>
                        <td className="right mono">{num(a.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState icon="building" title="No agencies yet" text="Agencies you create will be ranked here by coins gifted to their hosts." />
              )}
            </Card>

            <Card title="Recent Admin Activity" sub="From the audit log">
              {d.auditRecent.length ? (
                <div className="feed">
                  {d.auditRecent.map((a, i) => (
                    <div className="feed__item" key={i}>
                      <span className="feed__dot" style={alertStyle(a.severity)}>
                        <Icon name={a.severity === 'critical' ? 'xCircle' : a.severity === 'warning' ? 'flag' : 'checkCircle'} size={15} />
                      </span>
                      <div>
                        <div className="feed__text">{a.text}</div>
                        <div className="feed__time hstack" style={{ gap: 8 }}>
                          <span>{a.time}</span>
                          <Badge tone={a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info'}>{a.severity}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="fileText" title="No audit entries yet" text="Admin actions — role changes, approvals, config edits — will be logged here." />
              )}
            </Card>
          </div>
        </>
      )}
    </>
  )
}

function alertStyle(sev) {
  if (sev === 'critical') return { background: 'var(--danger-bg)', color: 'var(--danger)' }
  if (sev === 'warning') return { background: 'var(--warning-bg)', color: 'var(--warning)' }
  return { background: 'var(--success-bg)', color: 'var(--success)' }
}
