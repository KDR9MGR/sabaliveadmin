import test from 'node:test'
import assert from 'node:assert/strict'
import { providerOf, watchLivekitRoom } from './liveWatchLivekit.js'

test('a live runs on MS cloud only when its provider says livekit; everything else (no column, agora, nothing) is Agora', () => {
  assert.equal(providerOf({ provider: 'livekit' }), 'livekit')
  assert.equal(providerOf({ provider: 'agora' }), 'agora')
  assert.equal(providerOf({}), 'agora')
  assert.equal(providerOf(null), 'agora')
  assert.equal(providerOf({ provider: 'LiveKit' }), 'agora')
})

/* a small stand-in for livekit-client: a Room that remembers its listeners and records what the watcher does to it */
function fakeLk() {
  const log = []
  const rooms = []
  class Room {
    constructor(opts) { this.opts = opts; this.handlers = {}; this.canPlaybackAudio = true; rooms.push(this) }
    on(ev, fn) { this.handlers[ev] = fn; return this }
    emit(ev, ...a) { this.handlers[ev]?.(...a) }
    async connect(url, token) { log.push(['connect', url, token]) }
    async startAudio() { log.push(['startAudio']) }
    async disconnect() { log.push(['disconnect']) }
  }
  const lk = { Room, RoomEvent: { TrackSubscribed: 'ts', TrackUnsubscribed: 'tu', ParticipantDisconnected: 'pd', AudioPlaybackStatusChanged: 'ap', Disconnected: 'dc' }, Track: { Kind: { Video: 'video', Audio: 'audio' } } }
  const track = (kind) => ({ kind, attach() { const el = { style: {}, remove() { log.push(['el-remove', kind]) }, appendTo: null }; return el }, detach() { log.push(['detach', kind]) }, setVolume(v) { log.push(['volume', v]) } })
  return { lk, log, rooms, track }
}

test('the watcher joins with the older signalling path (singlePeerConnection false) and reports video, audio and who left', async () => {
  const { lk, log, rooms, track } = fakeLk()
  const seen = []
  const w = await watchLivekitRoom({
    lk, url: 'wss://x', token: 'tok',
    handlers: {
      onVideo: (id, p) => seen.push(['video', id, typeof p.play, typeof p.stop]),
      onVideoGone: (id) => seen.push(['video-gone', id]),
      onAudio: (id, a) => { seen.push(['audio', id]); a.setVolume(0) },
      onAudioGone: (id) => seen.push(['audio-gone', id]),
      onSoundBlocked: () => seen.push(['blocked']),
      onClosed: () => seen.push(['closed']),
    },
  })
  const room = rooms[0]
  assert.deepEqual(room.opts, { adaptiveStream: false, dynacast: false, singlePeerConnection: false })
  assert.deepEqual(log[0], ['connect', 'wss://x', 'tok'])

  room.emit('ts', track('video'), {}, { identity: 'host' })
  room.emit('ts', track('audio'), {}, { identity: 'host' })
  room.canPlaybackAudio = false
  room.emit('ap')
  room.emit('pd', { identity: 'host' })
  assert.deepEqual(seen, [['video', 'host', 'function', 'function'], ['audio', 'host'], ['blocked'], ['video-gone', 'host'], ['audio-gone', 'host']])
  assert.ok(log.some((l) => l[0] === 'volume' && l[1] === 0))

  await w.startAudio()
  assert.ok(log.some((l) => l[0] === 'startAudio'))
  await w.leave()
  assert.ok(log.some((l) => l[0] === 'disconnect'))
})

test('leaving on purpose does not report a closed room; a server drop does', async () => {
  const a = fakeLk()
  const seenA = []
  const wa = await watchLivekitRoom({ lk: a.lk, url: 'u', token: 't', handlers: { onClosed: () => seenA.push('closed') } })
  a.rooms[0].emit('dc')
  assert.deepEqual(seenA, ['closed'])
  const b = fakeLk()
  const seenB = []
  const wb = await watchLivekitRoom({ lk: b.lk, url: 'u', token: 't', handlers: { onClosed: () => seenB.push('closed') } })
  await wb.leave()
  b.rooms[0].emit('dc')
  assert.deepEqual(seenB, [])
  await wa.leave()
})

test('a track from a participant with no identity is ignored, not a crash', async () => {
  const f = fakeLk()
  let n = 0
  await watchLivekitRoom({ lk: f.lk, url: 'u', token: 't', handlers: { onVideo: () => { n += 1 } } })
  f.rooms[0].emit('ts', f.track('video'), {}, {})
  assert.equal(n, 0)
})
