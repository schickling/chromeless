const CDP = require('chrome-remote-interface')
import { Launcher } from 'chrome-launcher'
import * as TestHelpers from '../../../utils/test_helper'
import LocalChrome from '../local'

describe('LocalChrome', () => {
  let chromeless

  let closeSpy
  let killSpy
  beforeEach(() => {
    closeSpy = jest.spyOn(CDP, 'Close')
    killSpy = jest.spyOn(Launcher.prototype, 'kill')
    chromeless = new LocalChrome(TestHelpers.defaultLaunchConfig)
  })

  afterEach(async () => {
    killSpy.mockRestore()
    closeSpy.mockRestore()
    await TestHelpers.cleanUpTabs()
  })

  test('gets version with port from options', async () => {
    const version = await chromeless.getVersionInfo()
    expect(version['User-Agent']).toContain('Chrome')
  })

  test('kills launched chrome instance', async () => {
    const c = new LocalChrome({
      launchChrome: true,
      cdp: { port: 8473 },
    })
    await c.close()
    expect(killSpy).toHaveBeenCalledTimes(1)
  })

  test('option to close tab', async () => {
    const opts = {
      cdp: {
        host: TestHelpers.defaultLaunchConfig.cdp.host,
        port: TestHelpers.defaultLaunchConfig.cdp.port,
        closeTab: true,
      },
    }

    const c = new LocalChrome(opts)

    await c.process({ type: 'goto', url: 'http://example.com' })
    await c.close()

    expect(closeSpy).toHaveBeenCalledTimes(1)
    const closeArgs = closeSpy.mock.calls[0][0]
    expect(typeof closeArgs.id).toBe('string')
    expect(closeArgs.port).toBe(opts.cdp.port)
    expect(closeArgs.host).toBe(opts.cdp.host)
  })
})
