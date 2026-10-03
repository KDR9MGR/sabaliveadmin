import { PageHeader, Card } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'
import ActiveRoomsGrid from '../components/ActiveRoomsGrid.jsx'

/* Super Admin / Master → Live Monitor. Every live that is on right now, with an
   invisible Watch button. */
export function LiveMonitor({ root = 'Platform' }) {
  return (
    <>
      <PageHeader title="Live Monitor" crumbs={['Home', root, 'Live Monitor']} />
      <Card>
        <div className="card__body hstack" style={{ gap: 10, fontSize: 13 }}>
          <Icon name="eye" size={18} />
          <span className="muted">
            Watch any live without being seen. You aren’t in the room’s viewer list or count, nothing
            is posted when you join, and the host isn’t told. Each watch is recorded for the Super Admin.
          </span>
        </div>
      </Card>
      <div style={{ height: 16 }} />
      <ActiveRoomsGrid />
    </>
  )
}
