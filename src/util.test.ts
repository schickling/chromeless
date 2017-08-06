import * as os from 'os'
import test from 'ava'
import Chromeless from '../src'

const testUrl = 'https://www.google.com'

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
  const screenshot = await chromeless.goto(testUrl).screenshot()
  const pdf = await chromeless.goto(testUrl).pdf()

  await chromeless.end()

  const regex = new RegExp(os.tmpdir())

  t.regex(screenshot, regex)
  t.regex(pdf, regex)
})
