import test from 'node:test'
import assert from 'node:assert/strict'
import { avatarProblem, avatarPath, avatarContentType, bustedUrl, AVATAR_MAX_BYTES } from './avatarRules.js'

const f = (name, size = 1000) => ({ name, size })

test('JPG, PNG and WebP up to 5 MB are fine, anything else is refused in words', () => {
  for (const n of ['a.jpg', 'a.JPEG', 'a.png', 'a.webp']) assert.equal(avatarProblem(f(n)), null, n)
  assert.match(avatarProblem(f('a.gif')), /JPG, PNG or WebP/)
  assert.match(avatarProblem(f('a.svg')), /JPG, PNG or WebP/)
  assert.match(avatarProblem(f('a.png', AVATAR_MAX_BYTES + 1)), /limit is 5 MB/)
  assert.equal(avatarProblem(f('a.png', AVATAR_MAX_BYTES)), null)
  assert.match(avatarProblem(null), /Choose a photo/)
})

test('the file lives in the account\'s own folder, with a registered content type', () => {
  assert.equal(avatarPath('u1', f('Me.PNG')), 'u1/avatar.png')
  assert.equal(avatarPath('u1', f('me.jpeg')), 'u1/avatar.jpg')
  assert.equal(avatarContentType(f('me.jpeg')), 'image/jpeg')
  assert.equal(avatarContentType(f('me.webp')), 'image/webp')
})

test('the saved address changes every time', () => {
  assert.equal(bustedUrl('http://x/a.png', 5), 'http://x/a.png?v=5')
})
