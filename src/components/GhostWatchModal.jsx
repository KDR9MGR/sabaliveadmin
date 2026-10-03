import { useEffect, useRef, useState } from 'react'
import { Overlay, Button, Badge, Person } from './ui.jsx'
import Icon from './Icon.jsx'
import {
  fetchGhostToken, logPanelWatch, getStreamState, listStreamViewers, listRecentChat, watchChat,
} from '../lib/liveWatch.js'
import { num } from '../data/util.js'

/* Watch a live from the panel without being seen (Super Admin / Master).
   Joins the Agora channel as an audience member — Agora never announces those —
   and never touches the room's viewer list, count or chat, so nobody in the room
   (host included) can tell. Video / audio are subscribed from every broadcaster in
   the channel (the host, seated guests, PK opponents). */

function VideoTile({ track, label }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || !track) return undefined
    track.play(ref.current, { fit: 'contain' })
    return () => { try { track.stop() } catch { /* already gone */ } }
  }, [track])
  return (
    <div className="gw-tile">
      <div className="gw-tile__video" ref={ref} />
      <span className="gw-tile__label">{label}</span>
    </div>
  )
}

export default function GhostWatchModal({ room, onClose }) {
  const [phase, setPhase] = useState('connecting') // connecting | live | ended | error
  const [error, setError] = useState('')
  const [videos, setVideos] = useState([]) // [{ uid, track }]
  const [audioUids, setAudioUids] = useState([]) // who is heard
  const [muted, setMuted] = useState(false)
  const [needsSound, setNeedsSound] = useState(false)
  const [stats, setStats] = useState({ viewers: room.viewers, likes: room.likes, coins: room.coins })
  const [viewers, setViewers] = useState([])
  const [chat, setChat] = useState([])
  const [tab, setTab] = useState('chat')
  const audioTracks = useRef(new Map()) // uid -> remote audio track
  const mutedRef = useRef(false)
  const chatEnd = useRef(null)

  /* --- Agora: join as audience, subscribe to everyone who publishes --- */
  useEffect(() => {
    let cancelled = false
    let client = null
    const forget = (uid) => {
      setVideos((v) => v.filter((x) => x.uid !== uid))
      audioTracks.current.delete(uid)
      setAudioUids((a) => a.filter((x) => x !== uid))
    }
    ;(async () => {
      try {
        const [{ default: AgoraRTC }, tok] = await Promise.all([import('agora-rtc-sdk-ng'), fetchGhostToken(room.id)])
        if (cancelled) return
        AgoraRTC.setLogLevel(3)
        AgoraRTC.onAudioAutoplayFailed = () => setNeedsSound(true)
        client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
        await client.setClientRole('audience')
        client.on('user-published', async (user, kind) => {
          try {
            await client.subscribe(user, kind)
          } catch { return }
          if (cancelled) return
          if (kind === 'video') {
            setVideos((v) => [...v.filter((x) => x.uid !== user.uid), { uid: user.uid, track: user.videoTrack }])
          } else {
            audioTracks.current.set(user.uid, user.audioTrack)
            user.audioTrack.setVolume(mutedRef.current ? 0 : 100)
            user.audioTrack.play()
            setAudioUids((a) => (a.includes(user.uid) ? a : [...a, user.uid]))
          }
        })
        client.on('user-unpublished', (user, kind) => {
          if (kind === 'video') setVideos((v) => v.filter((x) => x.uid !== user.uid))
          else { audioTracks.current.delete(user.uid); setAudioUids((a) => a.filter((x) => x !== user.uid)) }
        })
        client.on('user-left', (user) => forget(user.uid))
        // tokens last an hour; keep a long watch alive
        client.on('token-privilege-will-expire', async () => {
          try { client.renewToken((await fetchGhostToken(room.id)).token) } catch { /* the next expiry will surface it */ }
        })
        await client.join(tok.appId, tok.channelName, tok.token, null)
        if (cancelled) return
        logPanelWatch(room.id).catch(() => {}) // the audit trail; never blocks watching
        setPhase('live')
      } catch (e) {
        if (!cancelled) { setError(e?.message || 'Could not join this live'); setPhase('error') }
      }
    })()
    return () => {
      cancelled = true
      audioTracks.current.clear()
      if (client) { client.removeAllListeners(); client.leave().catch(() => {}) }
    }
  }, [room.id])

  /* --- room facts: counts, who's watching, and whether it is still live --- */
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const [s, v] = await Promise.all([getStreamState(room.id), listStreamViewers(room.id)])
        if (!alive) return
        if (s) setStats({ viewers: s.viewer_count || 0, likes: s.like_count || 0, coins: s.gift_coin_total || 0 })
        setViewers(v)
        if (s && s.status !== 'live') setPhase((p) => (p === 'error' ? p : 'ended'))
      } catch { /* a missed refresh just shows the previous numbers */ }
    }
    tick()
    const t = setInterval(tick, 8000)
    return () => { alive = false; clearInterval(t) }
  }, [room.id])

  /* --- chat (read-only) --- */
  useEffect(() => {
    let alive = true
    listRecentChat(room.id).then((rows) => { if (alive) setChat(rows) }).catch(() => {})
    const stop = watchChat(room.id, (line) => setChat((c) => [...c.slice(-199), line]))
    return () => { alive = false; stop() }
  }, [room.id])
  useEffect(() => { chatEnd.current?.scrollIntoView({ block: 'end' }) }, [chat, tab])

  const toggleMute = () => {
    const next = !muted
    mutedRef.current = next
    setMuted(next)
    audioTracks.current.forEach((t) => t.setVolume(next ? 0 : 100))
  }
  const enableSound = () => {
    audioTracks.current.forEach((t) => t.play())
    setNeedsSound(false)
  }

  const noMedia = phase === 'live' && videos.length === 0
  return (
    <Overlay onClose={onClose}>
      <div className="gw" role="dialog" aria-modal="true">
        <div className="gw__head">
          <div className="hstack" style={{ gap: 12, minWidth: 0 }}>
            <Person name={room.host} size="sm" meta={room.username ? `@${room.username}` : room.category} />
            <div style={{ minWidth: 0 }}>
              <div className="gw__title">{room.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {num(stats.viewers)} watching · 🪙 {num(stats.coins)} · ♥ {num(stats.likes)}
              </div>
            </div>
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <Badge tone="muted"><Icon name="eye" size={12} /> Ghost view · invisible</Badge>
            <button className="x-btn" onClick={onClose} aria-label="Leave"><Icon name="x" size={18} /></button>
          </div>
        </div>

        <div className="gw__body">
          <div className="gw__stage">
            {phase === 'connecting' && <div className="gw__msg"><Icon name="refresh" size={22} /> Joining quietly…</div>}
            {phase === 'error' && (
              <div className="gw__msg"><Icon name="xCircle" size={22} /> {error}</div>
            )}
            {phase === 'ended' && <div className="gw__msg"><Icon name="radio" size={22} /> This live has ended.</div>}
            {noMedia && (
              <div className="gw__msg">
                <Icon name={room.isAudio ? 'radio' : 'video'} size={22} />
                {room.isAudio ? 'Audio room — you can hear it, there is no video.' : 'Waiting for the host’s video…'}
              </div>
            )}
            {videos.length > 0 && (
              <div className={`gw__grid gw__grid--${Math.min(videos.length, 4)}`}>
                {videos.map((v, i) => <VideoTile key={v.uid} track={v.track} label={i === 0 ? 'Host' : `Guest ${i}`} />)}
              </div>
            )}
            {phase === 'live' && (
              <div className="gw__controls">
                <Button size="sm" icon={muted ? 'x' : 'activity'} onClick={toggleMute}>{muted ? 'Unmute' : 'Mute'}</Button>
                <span className="gw__chip">{audioUids.length} {audioUids.length === 1 ? 'voice' : 'voices'}</span>
                {needsSound && <Button size="sm" variant="primary" onClick={enableSound}>Click to enable sound</Button>}
              </div>
            )}
          </div>

          <aside className="gw__side">
            <div className="gw__tabs">
              <button className={tab === 'chat' ? 'is-on' : ''} onClick={() => setTab('chat')}>Chat</button>
              <button className={tab === 'viewers' ? 'is-on' : ''} onClick={() => setTab('viewers')}>
                Viewers ({viewers.length})
              </button>
            </div>
            {tab === 'chat' ? (
              <div className="gw__list">
                {chat.length === 0 && <div className="muted" style={{ fontSize: 12.5 }}>No messages yet.</div>}
                {chat.map((m) => (
                  <div key={m.id} className={`gw__line${m.kind === 'system' ? ' gw__line--sys' : ''}`}>
                    <b>{m.name}</b> {m.body}
                  </div>
                ))}
                <div ref={chatEnd} />
              </div>
            ) : (
              <div className="gw__list">
                {viewers.length === 0 && <div className="muted" style={{ fontSize: 12.5 }}>Nobody else is watching.</div>}
                {viewers.map((v) => (
                  <div key={v.id} className="gw__line"><b>{v.name}</b>{v.username && <span className="muted"> @{v.username}</span>}</div>
                ))}
              </div>
            )}
            <div className="gw__foot muted">You aren’t listed here and nothing was posted when you joined.</div>
          </aside>
        </div>
      </div>
    </Overlay>
  )
}
