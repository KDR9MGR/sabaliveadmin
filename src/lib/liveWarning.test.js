import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_WARNINGS, LIVE_WARNING_MAX, readLiveWarnings, checkLiveWarnings, shownText } from './liveWarning.js'

const EMPTY = { video: { enabled: true, text: '' }, audio: { enabled: true, text: '' } }

test('nothing saved, or a database without the columns: both on, built-in texts (empty boxes)', () => {
  for (const row of [null, undefined, {}, { video_warning_enabled: null, video_warning_text: null, audio_warning_enabled: null }]) {
    assert.deepEqual(readLiveWarnings(row), EMPTY)
  }
})

test('the two warnings are read apart', () => {
  const r = readLiveWarnings({ video_warning_enabled: false, video_warning_text: '  Video rules.  ', audio_warning_enabled: true, audio_warning_text: 'Audio rules.' })
  assert.deepEqual(r, { video: { enabled: false, text: 'Video rules.' }, audio: { enabled: true, text: 'Audio rules.' } })
  assert.equal(readLiveWarnings({ audio_warning_enabled: false }).video.enabled, true, 'only the audio one is off')
})

test('blank, over-long and non-text values mean the built-in text; a non-boolean switch stays on', () => {
  for (const kind of ['video', 'audio']) {
    assert.equal(readLiveWarnings({ [`${kind}_warning_text`]: '   ' })[kind].text, '')
    assert.equal(readLiveWarnings({ [`${kind}_warning_text`]: 'x'.repeat(LIVE_WARNING_MAX + 1) })[kind].text, '')
    assert.equal(readLiveWarnings({ [`${kind}_warning_text`]: 'x'.repeat(LIVE_WARNING_MAX) })[kind].text.length, LIVE_WARNING_MAX)
    assert.equal(readLiveWarnings({ [`${kind}_warning_text`]: 5 })[kind].text, '')
    assert.equal(readLiveWarnings({ [`${kind}_warning_enabled`]: 'no' })[kind].enabled, true)
  }
})

test('saving: both are written, texts trimmed, a blank text clears its column, too long is refused naming the kind', () => {
  assert.deepEqual(checkLiveWarnings({ video: { enabled: true, text: '  Respect everyone.  ' }, audio: { enabled: false, text: '' } }), {
    patch: { video_warning_enabled: true, video_warning_text: 'Respect everyone.', audio_warning_enabled: false, audio_warning_text: null },
  })
  assert.deepEqual(checkLiveWarnings(EMPTY).patch, { video_warning_enabled: true, video_warning_text: null, audio_warning_enabled: true, audio_warning_text: null })
  assert.match(checkLiveWarnings({ ...EMPTY, audio: { enabled: true, text: 'x'.repeat(LIVE_WARNING_MAX + 1) } }).error, /audio warning .* at most 600/)
  assert.match(checkLiveWarnings({ ...EMPTY, video: { enabled: true, text: 'x'.repeat(LIVE_WARNING_MAX + 1) } }).error, /video warning .* at most 600/)
  assert.ok(checkLiveWarnings({ ...EMPTY, audio: { enabled: true, text: 'x'.repeat(LIVE_WARNING_MAX) } }).patch)
})

test('the built-in texts differ, and the preview shows what a phone shows', () => {
  assert.notEqual(DEFAULT_WARNINGS.video, DEFAULT_WARNINGS.audio)
  assert.match(DEFAULT_WARNINGS.audio, /audio room/)
  assert.equal(shownText({ text: '' }, 'video'), DEFAULT_WARNINGS.video)
  assert.equal(shownText({ text: '' }, 'audio'), DEFAULT_WARNINGS.audio)
  assert.equal(shownText({ text: '  Hello  ' }, 'audio'), 'Hello')
  assert.equal(shownText(undefined, 'video'), DEFAULT_WARNINGS.video)
})
