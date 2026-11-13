/* Invisible live viewing of a room that runs on MS cloud (LiveKit, hosted by LiveCore). Since 2026-11-07 every new live is created on MS cloud (app_config.feature_flags.rtc_livekit_new_lives,
   live_streams.rtc_provider = 'livekit'), and the Live Monitor only knew how to join Agora, so it showed an empty room for every live (2026-11-14). This is the LiveKit half.
   The panel asks the app's own `livekit-token` function for a subscriber token with ghost:true: the function lets only a Super Admin / Master / ghost account ask, makes the token view-only and
   HIDDEN (the room's participant list never shows it), so nobody in the room can tell.
   `watchLivekitRoom` takes the livekit-client module as an argument so a test can hand it a fake. Options match what the phone app's SDK uses and what the Stream Test proved against LiveCore:
   singlePeerConnection: false = the older "/rtc" signalling path (the newest web SDK's "/rtc/v1" gets a 404 from LiveCore and the browser blocks the fallback). */

/* the live's provider as the list reads it: anything but 'livekit' (or no column yet) is Agora, which is what every room used before */
export const providerOf = (room) => (room?.provider === 'livekit' ? 'livekit' : 'agora')

/* Joins `url` with `token` and calls the handlers as people publish. Returns { leave() }.
   handlers: onVideo(id, { play(el), stop() }), onVideoGone(id), onAudio(id, { setVolume(0..100) }), onAudioGone(id), onSoundBlocked(), onClosed() */
export async function watchLivekitRoom({ lk, url, token, handlers }) {
  const room = new lk.Room({ adaptiveStream: false, dynacast: false, singlePeerConnection: false })
  const audioEls = new Map() // participant identity -> <audio>
  const videoEls = new Map() // participant identity -> <video>
  let left = false

  const dropVideo = (id) => {
    const el = videoEls.get(id)
    if (!el) return
    videoEls.delete(id)
    handlers.onVideoGone?.(id)
  }
  const dropAudio = (id) => {
    const el = audioEls.get(id)
    if (!el) return
    audioEls.delete(id)
    try { el.track?.detach?.(el.el) } catch { /* already detached */ }
    try { el.el?.remove?.() } catch { /* already gone */ }
    handlers.onAudioGone?.(id)
  }

  room.on(lk.RoomEvent.TrackSubscribed, (track, _publication, participant) => {
    const id = participant?.identity
    if (!id) return
    if (track.kind === lk.Track.Kind.Video) {
      videoEls.set(id, track)
      handlers.onVideo?.(id, {
        play(container) {
          const v = track.attach()
          v.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000'
          container.appendChild(v)
          this._el = v
        },
        stop() {
          try { track.detach(this._el) } catch { /* already detached */ }
          try { this._el?.remove?.() } catch { /* already gone */ }
        },
      })
    } else if (track.kind === lk.Track.Kind.Audio) {
      const el = track.attach()
      el.style.display = 'none'
      if (typeof document !== 'undefined') document.body.appendChild(el)
      audioEls.set(id, { track, el })
      handlers.onAudio?.(id, { setVolume: (v) => { try { track.setVolume(Math.max(0, Math.min(1, v / 100))) } catch { /* not ready */ } } })
    }
  })
  room.on(lk.RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
    const id = participant?.identity
    if (!id) return
    if (track.kind === lk.Track.Kind.Video) dropVideo(id)
    else if (track.kind === lk.Track.Kind.Audio) dropAudio(id)
  })
  room.on(lk.RoomEvent.ParticipantDisconnected, (participant) => {
    dropVideo(participant?.identity)
    dropAudio(participant?.identity)
  })
  room.on(lk.RoomEvent.AudioPlaybackStatusChanged, () => { if (!room.canPlaybackAudio) handlers.onSoundBlocked?.() })
  room.on(lk.RoomEvent.Disconnected, () => { if (!left) handlers.onClosed?.() })

  await room.connect(url, token)
  return {
    async startAudio() { try { await room.startAudio() } catch { /* the browser still blocks it: the button stays */ } },
    async leave() {
      left = true
      for (const id of [...audioEls.keys()]) dropAudio(id)
      try { await room.disconnect() } catch { /* already gone */ }
    },
  }
}
