import * as os from 'os'
import * as CDP from 'chrome-remote-interface';
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

test('print to pdf', async () => {
  // not implemented in non-headless mode
  const info = await CDP.Version(defaultLaunConfig.cdp)
  const isHeadless = info['User-Agent'].includes('Headless')

  let error
  let filePath
  try {
    filePath = await chromeless.goto('https://www.google.com').pdf()
  } catch (err) {
    error = err
  }

  if (isHeadless) {
    expect(error).toBeUndefined()
    expect(filePath).toContain(os.tmpdir())
    console.log(filePath)
    expect(filePath.endsWith('.pdf')).toBe(true)
  } else  {
    expect(filePath).toBeUndefined()
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('PrintToPDF is not implemented')
  }
})
