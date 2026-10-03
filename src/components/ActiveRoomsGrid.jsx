import { useEffect, useState } from 'react'
import { Card, Person, Badge, Button } from './ui.jsx'
import { AsyncView } from '../pages/_templates.jsx'
import Icon from './Icon.jsx'
import GhostWatchModal from './GhostWatchModal.jsx'
import { listActiveStreams } from '../lib/workflows.js'
import { useAsyncData } from '../lib/useAsync.js'
import { useAuth } from '../lib/auth.jsx'
import { num } from '../data/util.js'

/* Every stream that is live right now. Super Admin / Master (anyone with the
   `monitor_lives` capability) also get a Watch button that opens the room
   invisibly — see GhostWatchModal. The list refreshes itself. */
export default function ActiveRoomsGrid({ pollMs = 20000 }) {
  const { can } = useAuth()
  const canWatch = can('monitor_lives')
  const { data: rooms, loading, error, reload } = useAsyncData(listActiveStreams)
  const [watching, setWatching] = useState(null)

  useEffect(() => {
    if (!pollMs) return undefined
    const t = setInterval(reload, pollMs)
    return () => clearInterval(t)
  }, [reload, pollMs])

  // keep showing the list while a refresh is in flight
  const initial = loading && !rooms
  return (
    <AsyncView loading={initial} error={error && !rooms ? error : ''} reload={reload}>
      {(rooms || []).length === 0 ? (
        <Card><div className="card__body"><Icon name="radio" size={20} /> <span className="muted">No streams are live right now.</span></div></Card>
      ) : (
        <div className="live-grid">
          {rooms.map((room) => (
            <div className="live-card" key={room.id}>
              <div className="live-card__thumb">
                <Icon name={room.isAudio ? 'activity' : 'radio'} size={28} />
                <span className="live-card__live">● LIVE</span>
                <span className="live-card__views">{num(room.viewers)} watching</span>
              </div>
              <div className="live-card__body">
                <div className="hstack spread">
                  <Person name={room.host} size="sm" meta={room.username ? `@${room.username}` : room.category} />
                  <span className="hstack" style={{ gap: 6 }}>
                    {room.isAudio && <Badge tone="info">Audio</Badge>}
                    {room.isPk && <Badge tone="warning">PK</Badge>}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>{room.title}</div>
                <div className="hstack spread muted" style={{ fontSize: 12 }}>
                  <span>{room.duration} · 🪙 {num(room.coins)} · ♥ {num(room.likes)}</span>
                  {canWatch && <Button size="sm" variant="primary" icon="eye" onClick={() => setWatching(room)}>Watch</Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {watching && <GhostWatchModal room={watching} onClose={() => setWatching(null)} />}
    </AsyncView>
  )
}
