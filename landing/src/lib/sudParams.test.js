import test from 'node:test'
import assert from 'node:assert/strict'
import { readLaunchParams, trustedApi, viewInfo, refreshRequest, startFailure, EXIT_URL, LOAD_TIMEOUT_MS, LOAD_TIMEOUT_MESSAGE } from './sudParams.js'

const good = '?appId=1000000000000000001&appKey=client-key&gameId=1468180338417074177&roomId=live-123&userId=b1000000-0000-0000-0000-0000000000b2&code=a.b.c&t=x.y.z&lang=en-US&api=https%3A%2F%2Fabc.supabase.co%2Ffunctions%2Fv1%2Fsud&test=1'

test('a complete address is read as it is', () => {
  const p = readLaunchParams(good)
  assert.equal(p.ok, true)
  assert.equal(p.appId, '1000000000000000001')
  assert.equal(p.gameId, '1468180338417074177')
  assert.equal(p.roomId, 'live-123')
  assert.equal(p.api, 'https://abc.supabase.co/functions/v1/sud')
  assert.equal(p.test, true)
  assert.equal(p.lang, 'en-US')
})

test('every missing or odd piece is refused with a plain message', () => {
  const cut = (key) => good.replace(new RegExp(`[?&]${key}=[^&]*`), '').replace(/^&/, '?')
  for (const key of ['appId', 'appKey', 'gameId', 'roomId', 'userId', 'code']) assert.equal(readLaunchParams(cut(key)).ok, false, key)
  assert.equal(readLaunchParams('').ok, false)
  assert.equal(readLaunchParams(good.replace('gameId=1468180338417074177', 'gameId=abc')).ok, false)
  assert.equal(readLaunchParams(good.replace('roomId=live-123', 'roomId=a%20b%3Cscript%3E')).ok, false)
  assert.match(readLaunchParams('').error, /not complete/)
})

test('the test flag: 0 means production, anything else the test environment', () => {
  assert.equal(readLaunchParams(good.replace('test=1', 'test=0')).test, false)
  assert.equal(readLaunchParams(good.replace('&test=1', '')).test, true)
})

test('a strange language falls back to English', () => {
  assert.equal(readLaunchParams(good.replace('lang=en-US', 'lang=%3Cx%3E')).lang, 'en-US')
  assert.equal(readLaunchParams(good.replace('lang=en-US', 'lang=ar-SA')).lang, 'ar-SA')
})

test('the renewal address must be our own Supabase function, never one a link makes up', () => {
  assert.equal(trustedApi('https://abc.supabase.co/functions/v1/sud'), 'https://abc.supabase.co/functions/v1/sud')
  assert.equal(trustedApi('https://abc.supabase.co/functions/v1/sud/'), 'https://abc.supabase.co/functions/v1/sud')
  for (const bad of ['http://abc.supabase.co/functions/v1/sud', 'https://evil.example.com/functions/v1/sud', 'https://abc.supabase.co.evil.com/functions/v1/sud', 'https://abc.supabase.co/functions/v1/other', 'javascript:alert(1)', '', null, undefined]) {
    assert.equal(trustedApi(bad), null, String(bad))
  }
  assert.equal(readLaunchParams(good.replace(/api=[^&]*/, 'api=https%3A%2F%2Fevil.example.com%2Ffunctions%2Fv1%2Fsud')).api, null)
})

test('the view size is in device pixels with no margin taken from the game', () => {
  assert.deepEqual(viewInfo(400, 400, 3), { ret_code: 0, ret_msg: 'success', view_size: { width: 1200, height: 1200 }, view_game_rect: { left: 0, top: 0, right: 0, bottom: 0 } })
  assert.equal(viewInfo(400.4, 300.6, 2.75).view_size.width, 1101)
  assert.equal(viewInfo(0, 0, 0).view_size.width, 1)
  assert.equal(viewInfo(100, 100, undefined).view_size.height, 100)
})

test('the renewal request posts the launch token to /refresh', () => {
  const r = refreshRequest('https://abc.supabase.co/functions/v1/sud', 'tok')
  assert.equal(r.url, 'https://abc.supabase.co/functions/v1/sud/refresh')
  assert.equal(r.init.method, 'POST')
  assert.deepEqual(JSON.parse(r.init.body), { t: 'tok' })
})

test('what a person reads when it fails, and the exit link the app understands', () => {
  assert.equal(startFailure(1004), 'The game could not start (1004). Please close it and try again.')
  assert.equal(startFailure(), 'The game could not start. Please close it and try again.')
  assert.ok(!startFailure('<img src=x>').includes('<'))
  assert.equal(EXIT_URL, 'tulasigame://exit')
})

test('a game that never starts gives up after 90 seconds with a plain message', () => {
  assert.equal(LOAD_TIMEOUT_MS, 90000)
  assert.match(LOAD_TIMEOUT_MESSAGE, /taking too long/)
})
