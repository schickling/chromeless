import * as os from 'os'
import { Chromeless } from '../'

import { defaultLaunConfig, closeAllButOneTab } from '../../utils/test_helper'

afterEach(async () => {
  await closeAllButOneTab()
})

test('google title', async () => {
  const chromeless = new Chromeless(defaultLaunConfig)
  const title = await chromeless
    .goto('https://www.google.com')
    .evaluate(() => document.title)

  await chromeless.end()
  expect(title).toBe('Google')
})

test('screenshot and pdf path', async () => {
  const chromeless = new Chromeless(defaultLaunConfig)
  const screenshot = await chromeless
    .goto('https://www.google.com')
    .screenshot()

  await chromeless.end()
  expect(screenshot).toContain(os.tmpdir())
})

test('not yet implemented pdf', async () => {
  const chromeless = new Chromeless(defaultLaunConfig)
  try {
    await chromeless.goto('https://www.google.com').pdf()
    await chromeless.end()
  } catch (err) {
    expect(err.message).toContain('PrintToPDF is not implemented')
  }
})
