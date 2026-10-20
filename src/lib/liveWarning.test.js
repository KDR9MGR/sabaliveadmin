import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_LIVE_WARNING, LIVE_WARNING_MAX, readLiveWarning, checkLiveWarning, shownText } from './liveWarning.js'

test('nothing saved, or a database without the columns: on, built-in text (an empty box)', () => {
  for (const row of [null, undefined, {}, { video_warning_enabled: null, video_warning_text: null }]) {
    assert.deepEqual(readLiveWarning(row), { enabled: true, text: '' })
  }
})

test('a saved switch and text are read; blank, over-long and non-text values mean the built-in text', () => {
  assert.deepEqual(readLiveWarning({ video_warning_enabled: false, video_warning_text: '  Be kind.  ' }), { enabled: false, text: 'Be kind.' })
  assert.equal(readLiveWarning({ video_warning_text: '   ' }).text, '')
  assert.equal(readLiveWarning({ video_warning_text: 'x'.repeat(LIVE_WARNING_MAX + 1) }).text, '')
  assert.equal(readLiveWarning({ video_warning_text: 'x'.repeat(LIVE_WARNING_MAX) }).text.length, LIVE_WARNING_MAX)
  assert.equal(readLiveWarning({ video_warning_text: 5 }).text, '')
  assert.equal(readLiveWarning({ video_warning_enabled: 'no' }).enabled, true)
})

test('saving: the text is trimmed, a blank text clears the column (the built-in one), too long is refused', () => {
  assert.deepEqual(checkLiveWarning({ enabled: true, text: '  Respect everyone.  ' }), { patch: { video_warning_enabled: true, video_warning_text: 'Respect everyone.' } })
  assert.deepEqual(checkLiveWarning({ enabled: false, text: '' }), { patch: { video_warning_enabled: false, video_warning_text: null } })
  assert.deepEqual(checkLiveWarning({ enabled: true, text: '   ' }), { patch: { video_warning_enabled: true, video_warning_text: null } })
  assert.match(checkLiveWarning({ enabled: true, text: 'x'.repeat(LIVE_WARNING_MAX + 1) }).error, /at most 600/)
  assert.ok(checkLiveWarning({ enabled: true, text: 'x'.repeat(LIVE_WARNING_MAX) }).patch)
})

test('the preview shows what a phone shows', () => {
  assert.equal(shownText({ text: '' }), DEFAULT_LIVE_WARNING)
  assert.equal(shownText({ text: '  Hello  ' }), 'Hello')
  assert.equal(shownText(undefined), DEFAULT_LIVE_WARNING)
})
