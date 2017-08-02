import Chromeless from '../src'

import test from 'ava'

// POC.
test('google title', async t => {
  const chromeless = new Chromeless({ launchChrome: false })
  const title = await chromeless
    .goto('https://www.google.com')
    .evaluate(() => document.title)

  await chromeless.end()

  t.is(title, 'Google')
})
