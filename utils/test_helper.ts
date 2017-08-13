import * as CDP from 'chrome-remote-interface'
import { ChromelessOptions, CDPOptions, TargetInfo, Client } from '../src/types'

const cdp: CDPOptions = {
  // using 4554 here to make sure we pass the port to all the correct spots
  port: parseInt(process.env['CHROMELESS_CHROME_PORT'], 10) || 4554,
}
export const defaultLaunchConfig: ChromelessOptions = {
  launchChrome: false,
  cdp
}

export const resolveValue = (reVal?: any) => (): Promise<any> => Promise.resolve(reVal)

// Just so we don't end up with a billion tabs, espeically when watching tests
export const cleanUpTabs = async (): Promise<void> => {
  const tabs = await CDP.List(cdp)
  if (tabs.length < 10) {
    return
  }
  await tabs.slice(9).forEach(async (t: TargetInfo) => {
    try {
      await CDP.Close(Object.assign({ id: t.id }, cdp))
    } catch (err) {}
  })
}

export const mockClientFactory = (): Client => ({
  Network: {
    enable: jest.fn(resolveValue()),
    canClearBrowserCookies: jest.fn(resolveValue(true)),
    clearBrowserCookies: jest.fn(resolveValue()),
    canClearBrowserCache: jest.fn(resolveValue(true)),
    clearBrowserCache: jest.fn(resolveValue()),
    setUserAgentOverride: jest.fn(resolveValue()),
  },
  Page: {
    enable: jest.fn(resolveValue()),
    navigate: jest.fn(resolveValue()),
    loadEventFired: jest.fn(resolveValue()),
    captureScreenshot: jest.fn(resolveValue({ data: 'some_blob' })),
    printToPDF: jest.fn(resolveValue({ data: 'pdf_blob' })),
  },
  DOM: {
    getDocument: jest.fn(
      resolveValue({
        root: { nodeId: 222 },
      }),
    ),
    querySelector: jest.fn(resolveValue({ id: 'default-id' })),
    focus: jest.fn(resolveValue()),
    setFileInputFiles: jest.fn(resolveValue())
  },
  Input: {
    dispatchMouseEvent: jest.fn(resolveValue()),
    dispatchKeyEvent: jest.fn(resolveValue()),
  },
  Target: {},
  Runtime: {
    evaluate: jest.fn(resolveValue()),
  },
  Emulation: {
    setDeviceMetricsOverride: jest.fn(resolveValue()),
    setVisibleSize: jest.fn(
      resolveValue({
        height: 900,
        width: 1440,
      }),
    ),
  },
  ChromeInfo: {
    'User-Agent': 'Chrome',
  },
  port: 1234,
  host: 'localhost',
  close: jest.fn(),
  target: {
    id: '123',
  },
})
