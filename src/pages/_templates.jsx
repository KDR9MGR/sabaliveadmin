import { PageHeader, Card, Button, EmptyState } from '../components/ui.jsx'
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

/* Shimmer placeholder while a list loads from Supabase. */
export function TableSkeleton({ rows = 8 }) {
  return (
    <div className="card">
      <div className="toolbar"><div className="search-input" style={{ opacity: 0.4 }} /></div>
      <div className="table-wrap">
        <table className="data">
          <tbody>
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i}>
                <td colSpan={8}><div className="skeleton-row" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function LoadError({ error, onRetry }) {
  return (
    <Card>
      <div className="card__body">
        <EmptyState icon="xCircle" title="Couldn't load this data" text={error} />
        {onRetry && (
          <div className="center">
            <Button variant="primary" icon="refresh" onClick={onRetry}>Retry</Button>
          </div>
        )}
      </div>
    </Card>
  )
}

/* One place for the load/error/ready fork so pages stay tidy. */
export function AsyncView({ loading, error, reload, children }) {
  if (error) return <LoadError error={error} onRetry={reload} />
  if (loading) return <TableSkeleton />
  return children
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
