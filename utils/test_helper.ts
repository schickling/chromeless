import * as CDP from 'chrome-remote-interface'
import { ChromelessOptions, CDPOptions, TargetInfo } from '../src/types'

const cdp: CDPOptions = {
  // using 4554 here to make sure we pass the port to all the correct spots
  port: parseInt(process.env['CHROMELESS_CHROME_PORT'], 10) || 4554,
}
export const defaultLaunConfig: ChromelessOptions = {
  debug: true,
  launchChrome: false,
  cdp
}

export const resolveValue = (reVal?: any) => (): Promise<any> => Promise.resolve(reVal)

export const closeAllButOneTab = async (): Promise<void> => {
  const tabs = await CDP.List(cdp)
  await tabs.slice(1).forEach(async (t: TargetInfo) => {
    await CDP.Close(Object.assign({ id: t.id }, cdp))
  })
}
