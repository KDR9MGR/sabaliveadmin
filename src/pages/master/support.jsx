import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader, Button, Avatar, Badge, PillTabs, EmptyState, useToast } from '../../components/ui.jsx'
import Icon from '../../components/Icon.jsx'
import { useAuth } from '../../lib/auth.jsx'
import { relativeTime } from '../../lib/format.js'
import {
  listThreads, listMessages, sendReply, markThreadRead, setThreadStatus, assignThread, watchSupport,
} from '../../lib/support.js'

/* Master / Super Admin → Support. The inbox for the app's Settings → Support chat. */
export function Support() {
  const toast = useToast()
  const { user } = useAuth()
  const [threads, setThreads] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('Open')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)
  const selectedRef = useRef(null)
  selectedRef.current = selected

  const loadThreads = useCallback(() =>
    listThreads().then((t) => { setThreads(t); setError('') }).catch((e) => setError(e.message || 'Could not load support')), [])
  const loadMessages = useCallback((id) =>
    listMessages(id).then(setMessages).catch(() => {}), [])

  useEffect(() => {
    loadThreads()
    return watchSupport(() => {
      loadThreads()
      if (selectedRef.current) loadMessages(selectedRef.current)
    })
  }, [loadThreads, loadMessages])

  const open = (id) => {
    setSelected(id)
    setMessages([])
    loadMessages(id)
    markThreadRead(id).then(loadThreads).catch(() => {})
  }
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages, selected])

  // a message that arrives in the open conversation is read straight away
  const cur = threads?.find((t) => t.id === selected)
  useEffect(() => {
    if (cur?.unread) markThreadRead(cur.id).then(loadThreads).catch(() => {})
  }, [cur?.unread, cur?.id, loadThreads])

  const shown = useMemo(() => (threads || []).filter((t) => {
    if (tab === 'Open' && t.status !== 'open') return false
    if (tab === 'Closed' && t.status !== 'closed') return false
    const s = q.trim().toLowerCase()
    return !s || `${t.name} ${t.username} ${t.displayId}`.toLowerCase().includes(s)
  }), [threads, tab, q])
  const openCount = (threads || []).filter((t) => t.status === 'open').length

  const run = async (fn, ok) => {
    setBusy(true)
    try { await fn(); if (ok) toast(ok); await loadThreads() } catch (e) { toast(e.message || 'That did not work') } finally { setBusy(false) }
  }
  const send = () => {
    const body = draft.trim()
    if (!body || !cur) return
    run(async () => { await sendReply(cur.id, body); setDraft(''); await loadMessages(cur.id) })
  }

  return (
    <>
      <PageHeader title="Support" crumbs={['Home', 'Platform', 'Support']} actions={<Badge tone={openCount ? 'warning' : 'muted'}>{openCount} open</Badge>} />
      {error && <div className="badge badge--danger" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="sp">
        <aside className="sp__list">
          <div className="sp__tools">
            <PillTabs tabs={['Open', 'Closed', 'All']} value={tab} onChange={setTab} />
            <input className="input" placeholder="Search name, @username or ID" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="sp__rows">
            {threads == null && <div className="muted" style={{ padding: 14, fontSize: 13 }}>Loading…</div>}
            {threads && shown.length === 0 && <div className="muted" style={{ padding: 14, fontSize: 13 }}>No conversations.</div>}
            {shown.map((t) => (
              <button key={t.id} className={`sp__row${t.id === selected ? ' is-on' : ''}`} onClick={() => open(t.id)}>
                <Avatar name={t.name} src={t.avatar} />
                <span className="sp__row-main">
                  <span className="sp__row-top"><b>{t.name}</b><span className="muted">{relativeTime(t.lastAt)}</span></span>
                  <span className="sp__row-last muted">{t.last || '—'}</span>
                </span>
                {t.unread > 0 && <span className="sp__dot">{t.unread}</span>}
              </button>
            ))}
          </div>
        </aside>

        <section className="sp__chat">
          {!cur ? (
            <EmptyState icon="mail" title="Pick a conversation" text="Messages from the app’s Support chat show here." />
          ) : (
            <>
              <div className="sp__head">
                <div className="hstack" style={{ gap: 10 }}>
                  <Avatar name={cur.name} src={cur.avatar} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{cur.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>@{cur.username} · ID {cur.displayId}{cur.assignee && ` · with ${cur.assignee}`}</div>
                  </div>
                </div>
                <div className="hstack" style={{ gap: 8 }}>
                  {cur.assignedTo !== user?.id && <Button size="sm" disabled={busy} onClick={() => run(() => assignThread(cur.id, user.id), 'Assigned to you')}>Assign to me</Button>}
                  {cur.status === 'open'
                    ? <Button size="sm" disabled={busy} onClick={() => run(() => setThreadStatus(cur.id, 'closed'), 'Conversation closed')}>Close</Button>
                    : <Button size="sm" disabled={busy} onClick={() => run(() => setThreadStatus(cur.id, 'open'), 'Reopened')}>Reopen</Button>}
                </div>
              </div>
              <div className="sp__msgs">
                {messages.map((m) => (
                  <div key={m.id} className={`sp__msg${m.fromStaff ? ' sp__msg--staff' : ''}`}>
                    <div className="sp__bubble">{m.body}</div>
                    <div className="sp__meta muted">{m.fromStaff ? m.by : cur.name} · {relativeTime(m.at)}</div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="sp__compose">
                <textarea
                  className="textarea" rows={2} placeholder="Reply as Support… (Ctrl+Enter to send)" value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send() } }}
                />
                <Button variant="primary" icon="arrowUpRight" disabled={busy || !draft.trim()} onClick={send}>Send</Button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  )
}
