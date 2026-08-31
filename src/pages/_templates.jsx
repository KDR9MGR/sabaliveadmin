import { PageHeader } from '../components/ui.jsx'
import DataTable from '../components/DataTable.jsx'

/* Generic list screen: header + data table. */
export function ListPage({ title, crumbs, actions, ...table }) {
  return (
    <>
      <PageHeader title={title} crumbs={crumbs} actions={actions} />
      <DataTable {...table} />
    </>
  )
}

/* Stat card grid */
import Icon from '../components/Icon.jsx'
export function StatCard({ stat }) {
  const positive = stat.dir === 'up'
  return (
    <div className="stat">
      <div className="stat__top">
        <div>
          <div className="stat__label">{stat.key}</div>
          <div className="stat__value">{stat.value}</div>
        </div>
        <div className={`stat__tile ${stat.tile}`}><Icon name={stat.icon} size={20} /></div>
      </div>
      {stat.delta != null && (
        <div className={`stat__delta ${positive ? 'up' : 'down'}`}>
          <Icon name={positive ? 'arrowUp' : 'arrowDown'} size={13} />
          {stat.delta}% <span className="since">vs last month</span>
        </div>
      )}
    </div>
  )
}
export function StatGrid({ stats }) {
  return (
    <div className="stat-grid">
      {stats.map((s) => <StatCard key={s.key} stat={s} />)}
    </div>
  )
}
