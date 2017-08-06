import * as os from 'os'
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

test('screenshot and pdf path', async t => {
  const chromeless = new Chromeless({ launchChrome: false })
  const screenshot = await chromeless
    .goto('https://www.google.com')
    .screenshot()
  const pdf = await chromeless.goto('https://www.google.com').pdf()

  await chromeless.end()

  if (os.platform() === 'win32') {
    t.regex(screenshot, /\\/)
    t.regex(pdf, /\\/)
  } else {
    t.regex(screenshot, /tmp/)
    t.regex(pdf, /tmp/)
  }
})
