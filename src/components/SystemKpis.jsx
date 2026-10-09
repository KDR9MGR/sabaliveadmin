import { useEffect, useState } from 'react'
import { Card, Button, Badge, Modal, useToast } from './ui.jsx'
import { StatGrid, AsyncView } from '../pages/_templates.jsx'
import { BarChart } from './charts.jsx'
import Icon from './Icon.jsx'
import { useAsyncData } from '../lib/useAsync.js'
import { getSystemKpis, restartProject, RESTART_PHRASE, fmtBytes, fmtDuration, fmtNum, fmtPct, loadTone } from '../lib/systemOps.js'

const REFRESH_MS = 120000

/* Live system numbers: Supabase production and staging, Agora usage, and what is live in the app right now.
   Used by Super Admin → System Overview and Master → System Management. Restart buttons appear only when the
   Edge Function says this account may restart (Super Admin, or a Master with System management). */
export default function SystemKpis() {
  const { data, loading, error, reload } = useAsyncData(getSystemKpis)
  const [restarting, setRestarting] = useState(null) // 'production' | 'staging'

  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState !== 'hidden') reload() }, REFRESH_MS)
    return () => clearInterval(t)
  }, [reload])

  return (
    <>
      <div className="spread" style={{ margin: '4px 0 12px' }}>
        <h3 style={{ fontSize: 15 }}>Live system KPIs</h3>
        <div className="hstack" style={{ gap: 10 }}>
          {data?.generatedAt && <span className="muted" style={{ fontSize: 12 }}>Updated {new Date(data.generatedAt).toLocaleTimeString()} · refreshes every 2 min</span>}
          <Button size="sm" icon="refresh" onClick={reload}>Refresh</Button>
        </div>
      </div>
      <AsyncView loading={loading && !data} error={error && !data ? error : ''} reload={reload}>
        {data && (
          <>
            {!data.configured?.supabase || !data.configured?.agora ? <SetupNote configured={data.configured} /> : null}
            <AppNow app={data.app} />
            <div className="grid cols-2 mt-16">
              <EnvCard title="Supabase — Production" target="production" env={data.production} canRestart={data.canRestart} onRestart={() => setRestarting('production')} />
              <EnvCard title="Supabase — Staging" target="staging" env={data.staging} canRestart={data.canRestart} onRestart={() => setRestarting('staging')} />
            </div>
            <AgoraCard agora={data.agora} />
          </>
        )}
      </AsyncView>
      {restarting && <RestartDialog target={restarting} onClose={() => setRestarting(null)} onDone={reload} />}
    </>
  )
}

export function SetupNote({ configured }) {
  const missing = [
    !configured?.supabase && 'Supabase (SUPABASE_ACCESS_TOKEN)',
    !configured?.agora && 'Agora (AGORA_CUSTOMER_ID, AGORA_CUSTOMER_SECRET, AGORA_PROJECT_ID)',
  ].filter(Boolean)
  return (
    <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5 }}>
      <b>Not connected yet:</b> {missing.join(' and ')}. These live as secrets on the <code>system-ops</code> Edge Function, set by
      whoever owns the accounts (Supabase dashboard → Edge Functions → Secrets, or <code>supabase secrets set NAME=value</code>). Until then those
      sections stay empty; the app numbers below come from our own database.
    </div></Card>
  )
}

export function AppNow({ app }) {
  if (!app || app.error) return null
  return (
    <StatGrid stats={[
      { key: 'Live rooms now', value: fmtNum(app.liveRooms), icon: 'radio', tile: 'tile-pink' },
      { key: 'Viewers now', value: fmtNum(app.viewers), icon: 'users', tile: 'tile-blue' },
    ]} />
  )
}

const Row = ({ label, children }) => (
  <div className="spread" style={{ padding: '6px 0', borderBottom: '1px solid var(--border, #0001)', fontSize: 13 }}>
    <span className="muted">{label}</span><span style={{ fontWeight: 600 }}>{children}</span>
  </div>
)
const failed = (x) => !x || x.error

export function EnvCard({ title, target, env, canRestart, onRestart }) {
  if (!env || env.configured === false) {
    return <Card title={title}><div className="card__body muted" style={{ fontSize: 13 }}>Not connected — set <code>SUPABASE_ACCESS_TOKEN</code> on the function.</div></Card>
  }
  const db = failed(env.database) ? null : env.database
  const info = failed(env.info) ? null : env.info
  const health = Array.isArray(env.health) ? env.health : null
  const res = failed(env.resources) ? null : env.resources
  const api = failed(env.api) ? null : env.api
  const connPct = db && db.max_connections ? Math.round((db.connections / db.max_connections) * 100) : null
  return (
    <Card
      title={title}
      sub={info ? `${info.name || ''} · ${info.region || ''} · ${env.ref}` : env.ref}
      action={info?.status ? <Badge tone={String(info.status).includes('HEALTHY') ? 'success' : 'warning'}>{info.status}</Badge> : <span />}
    >
      <div className="card__body">
        {health && (
          <div className="hstack wrap" style={{ gap: 6, marginBottom: 10 }}>
            {health.map((h) => <Badge key={h.service} tone={h.healthy ? 'success' : 'danger'}>{h.service}</Badge>)}
          </div>
        )}
        {db ? (
          <>
            <Row label="Connections">
              <Badge tone={loadTone(connPct)}>{fmtNum(db.connections)} / {fmtNum(db.max_connections)}{connPct != null ? ` (${connPct}%)` : ''}</Badge>
            </Row>
            <Row label="Database size">{fmtBytes(db.db_size_bytes)}</Row>
            <Row label="Cache hit">{fmtPct(db.cache_hit_percent)}</Row>
            <Row label="Active queries / idle in transaction">{fmtNum(db.active_queries)} / {fmtNum(db.idle_in_transaction)}</Row>
            <Row label="Longest running query">{fmtDuration(db.longest_active_seconds)}</Row>
            <Row label="Deadlocks (since start)">{fmtNum(db.deadlocks)}</Row>
            <Row label="Database uptime">{fmtDuration(db.uptime_seconds)}</Row>
            {db.profiles_estimate != null && <Row label="Profiles (estimate)">{fmtNum(db.profiles_estimate)}</Row>}
          </>
        ) : <div className="muted" style={{ fontSize: 12.5 }}>Database numbers unavailable{env.database?.error ? `: ${env.database.error}` : ''}.</div>}
        {res && (res.memUsedPercent != null || res.diskUsedPercent != null || res.load1 != null) && (
          <div style={{ marginTop: 10 }}>
            {res.load1 != null && <Row label={`CPU load (1 min${res.cpuCount ? `, ${res.cpuCount} cores` : ''})`}>{res.load1}</Row>}
            {res.memUsedPercent != null && <Row label="Memory used"><Badge tone={loadTone(res.memUsedPercent)}>{fmtPct(res.memUsedPercent)}</Badge></Row>}
            {res.diskUsedPercent != null && <Row label={`Disk used (${res.diskMount || ''})`}><Badge tone={loadTone(res.diskUsedPercent)}>{fmtPct(res.diskUsedPercent)} of {fmtBytes(res.diskTotalBytes)}</Badge></Row>}
          </div>
        )}
        {api && (
          <div style={{ marginTop: 10 }}>
            <Row label="API requests (last 24 h)">{fmtNum(api.total)}</Row>
            <div className="muted" style={{ fontSize: 12, padding: '4px 0' }}>
              REST {fmtNum(api.rest)} · Auth {fmtNum(api.auth)} · Realtime {fmtNum(api.realtime)} · Storage {fmtNum(api.storage)}
            </div>
          </div>
        )}
        {db?.top_tables?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Largest tables</div>
            {db.top_tables.map((t) => (
              <div className="spread" key={t.name} style={{ fontSize: 12.5, padding: '2px 0' }}>
                <span className="mono">{t.name}</span><span>{fmtBytes(t.bytes)} · {fmtNum(t.rows)} rows</span>
              </div>
            ))}
          </div>
        )}
        {canRestart && (
          <div style={{ marginTop: 14 }}>
            <Button variant="danger" size="sm" icon="refresh" onClick={onRestart}>Restart {target}</Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export function AgoraCard({ agora }) {
  if (!agora || agora.configured === false) {
    return (
      <Card title="Agora usage" className="mt-16"><div className="card__body muted" style={{ fontSize: 13 }}>
        Not connected — set <code>AGORA_CUSTOMER_ID</code>, <code>AGORA_CUSTOMER_SECRET</code> and <code>AGORA_PROJECT_ID</code> on the function (Agora Console → Developer Toolkit → RESTful API).
      </div></Card>
    )
  }
  if (agora.error) {
    return <Card title="Agora usage" className="mt-16"><div className="card__body" style={{ fontSize: 13, color: 'var(--danger)' }}>{agora.error}</div></Card>
  }
  const days = agora.days || []
  return (
    <Card title="Agora usage" sub={`Minutes (UTC) · ${agora.from} to ${agora.to} · today is excluded, Agora keeps changing it`} className="mt-16">
      <div className="card__body">
        <StatGrid stats={[
          { key: 'This month (audio min)', value: fmtNum(agora.monthToDate?.audioMin), icon: 'radio', tile: 'tile-pink' },
          { key: 'This month (video min)', value: fmtNum(agora.monthToDate?.videoMin), icon: 'video', tile: 'tile-blue' },
          { key: 'This month (total min)', value: fmtNum(agora.monthToDate?.totalMin), icon: 'activity', tile: 'tile-purple' },
          { key: 'Last 7 days (total min)', value: fmtNum(agora.last7?.totalMin), icon: 'clock', tile: 'tile-orange' },
        ]} />
        {days.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <BarChart series={days.map((d) => d.totalMin)} categories={days.map((d) => d.date.slice(5))} color="#ec4899" height={220} label="Minutes" />
          </div>
        )}
      </div>
    </Card>
  )
}

function RestartDialog({ target, onClose, onDone }) {
  const toast = useToast()
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const phrase = RESTART_PHRASE(target)
  const go = async () => {
    setBusy(true)
    setError('')
    try {
      const r = await restartProject(target)
      toast(r?.message || `${target} is restarting`)
      onClose()
      onDone?.()
    } catch (e) {
      setError(e.message || 'Could not restart')
    } finally { setBusy(false) }
  }
  return (
    <Modal
      title={`Restart ${target}?`}
      onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" icon={busy ? 'refresh' : 'refresh'} disabled={busy || typed !== phrase} onClick={go}>{busy ? 'Restarting…' : `Restart ${target}`}</Button>
      </>}
    >
      <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 10 }}>
        {target === 'production'
          ? 'This restarts the LIVE Supabase project: the database, the API and Realtime go down for a minute or two for every app user and for this panel. It is a last resort — check the numbers above first.'
          : 'This restarts the staging Supabase project. Production is not touched.'}
        {' '}Each restart is recorded in the audit log, and a project can only be restarted once every 15 minutes.
      </p>
      <div className="field">
        <label>Type <b className="mono">{phrase}</b> to confirm</label>
        <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" placeholder={phrase} />
      </div>
      {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</div>}
    </Modal>
  )
}
