import Chromeless from '../src'

import test from 'ava'

test('google title', async t => {
  const chromeless = new Chromeless()
  const title = await chromeless
    .goto('https://www.google.com')
    .evaluate(() => document.title)

  await chromeless.end()

  t.is(title, 'Google')
})
