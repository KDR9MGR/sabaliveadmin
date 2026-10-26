import test from 'node:test'
import assert from 'node:assert/strict'
import { mediaKind, isSvg, looksLikeSvg, svgProblem, SVG_UPLOAD_CONTENT_TYPE } from './mediaTypes.js'

test('what an uploaded file is, from its address', () => {
  assert.equal(mediaKind('https://x.supabase.co/storage/v1/object/public/gift-assets/gifts/a.svga'), 'svga')
  assert.equal(mediaKind('https://x.supabase.co/storage/v1/object/public/gift-assets/gifts/a.svg'), 'svg')
  assert.equal(mediaKind('https://x.supabase.co/storage/v1/object/public/gift-assets/gifts/a.SVG?v=2'), 'svg')
  assert.equal(mediaKind('https://x/a.mp4'), 'video')
  assert.equal(mediaKind('https://x/a.png'), 'image')
  assert.equal(mediaKind('https://x/a.mp3'), 'audio')
  assert.equal(mediaKind('https://x/a.bin'), 'other')
  assert.equal(mediaKind(''), 'other')
  assert.equal(mediaKind(null), 'other')
  assert.equal(isSvg('https://x/a.svg'), true)
  assert.equal(isSvg('https://x/a.svga'), false, 'SVGA is a different thing')
})

test('an SVG is sent as a generic binary, like SVGA', () => {
  assert.equal(SVG_UPLOAD_CONTENT_TYPE, 'application/octet-stream')
})

test('a file that is an SVG drawing is recognised, others are not', () => {
  assert.equal(looksLikeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>'), true)
  assert.equal(looksLikeSvg('<?xml version="1.0"?>\n<!-- made by a tool -->\n<svg width="10" height="10">'), true)
  assert.equal(looksLikeSvg('﻿<SVG viewBox="0 0 1 1"/>'), true)
  assert.equal(looksLikeSvg('<html><body>not a drawing</body></html>'), false)
  assert.equal(looksLikeSvg('PNG\u0000binary'), false)
  assert.equal(looksLikeSvg(''), false)
  assert.equal(looksLikeSvg(undefined), false)
})

test('an SVG with a script, an event handler, embedded HTML or a javascript: link is refused', () => {
  assert.equal(svgProblem('<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="red"/></svg>'), '')
  assert.match(svgProblem('<svg><script>alert(1)</script></svg>'), /script/)
  assert.match(svgProblem('<svg><SCRIPT src="x"></SCRIPT></svg>'), /script/)
  assert.match(svgProblem('<svg onload="alert(1)"></svg>'), /event handler/)
  assert.match(svgProblem('<svg><rect onclick = "x()"/></svg>'), /event handler/)
  assert.match(svgProblem('<svg><foreignObject><div/></foreignObject></svg>'), /HTML/)
  assert.match(svgProblem('<svg><a href="javascript:alert(1)"><rect/></a></svg>'), /javascript/)
  // plain words that merely contain "on" are fine
  assert.equal(svgProblem('<svg><text>Lemon and onion</text><g transform="translate(1 1)"/></svg>'), '')
})
