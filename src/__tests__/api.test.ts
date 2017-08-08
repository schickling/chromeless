import * as os from 'os'
import { Chromeless } from '../'

import { defaultLaunConfig, closeAllButOneTab } from '../../utils/test_helper'

let chromeless: Chromeless<any>

beforeEach(() => {
  chromeless = new Chromeless(defaultLaunConfig)
})

afterEach(async () => {
  await closeAllButOneTab()
})

test('google title', async () => {
  const title = await chromeless
    .goto('https://www.google.com')
    .evaluate(() => document.title)
  expect(title).toBe('Google')
})

test('screenshot and pdf path', async () => {
  const screenshot = await chromeless
    .goto('https://www.google.com')
    .screenshot()

  expect(screenshot).toContain(os.tmpdir())
})

test('not yet implemented pdf', async () => {
  let error
  try {
    await chromeless.goto('https://www.google.com').pdf()
  } catch (err) {
    error = err
  }
  expect(error).toBeInstanceOf(Error)
  expect(error.message).toContain('PrintToPDF is not implemented')
})
