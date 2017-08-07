import * as TestHelpers from '../../../utils/test_helper'
import LocalChrome from '../local'
import { TargetInfo } from '../../types'

const chromeless = new LocalChrome(TestHelpers.defaultLaunConfig)

afterEach(async () => {
  await TestHelpers.closeAllButOneTab()
})

test('gets version with port from options', async () => {
  const version = await chromeless.getVersionInfo()
  expect(version['User-Agent']).toContain('Chrome')
})

test('lists tabs', async () => {
  const tabs: Array<TargetInfo> = await chromeless.listTargets()
  expect(tabs).toBeInstanceOf(Array)
})
