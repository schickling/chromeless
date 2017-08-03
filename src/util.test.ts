import test from 'ava'
import Chromeless from '../src'

// POC
test('google title', async t => {
  const chromeless = new Chromeless({ launchChrome: false })
  const title = await chromeless
    .goto('https://www.google.com')
    .evaluate(() => document.title)

  await chromeless.end()

  t.is(title, 'Google')
})
