import { Chrome, Command, ChromelessOptions, Client } from '../types'
import * as CDP from 'chrome-remote-interface'
import { LaunchedChrome, launch } from 'chrome-launcher'
import LocalRuntime from './local-runtime'
import { evaluate, setViewport } from '../util'
import { DeviceMetrics } from '../types'

interface RuntimeClient {
  client: Client
  runtime: LocalRuntime
}

export default class LocalChrome implements Chrome {
  private options: ChromelessOptions
  private runtimeClientPromise: Promise<RuntimeClient>
  private chromeInstance?: LaunchedChrome

  constructor(options: ChromelessOptions = {}) {
    this.options = options

    this.runtimeClientPromise = this.initRuntimeClient()
  }

  private async initRuntimeClient(): Promise<RuntimeClient> {
    const client = this.options.launchChrome
      ? await this.startChrome()
      : await this.connectToChrome()

    const { viewport = {} as DeviceMetrics } = this.options
    await setViewport(client, viewport as DeviceMetrics)

    const runtime = new LocalRuntime(client, this.options)

    return { client, runtime }
  }

  private async startChrome(): Promise<Client> {
    this.chromeInstance = await launch({
      logLevel: this.options.debug ? 'info' : 'silent',
      port: this.options.cdp.port,
    })
    return await CDP({ port: this.chromeInstance.port })
  }

  private async connectToChrome(): Promise<Client> {
    const target = await CDP.New({
      port: this.options.cdp.port,
      host: this.options.cdp.host,
    })
    return await CDP({ target })
  }

  private async setViewport(client: Client) {
    const { viewport = {} } = this.options

    const config: any = {
      deviceScaleFactor: 1,
      mobile: false,
      scale: viewport.scale || 1,
      fitWindow: false, // as we cannot resize the window, `fitWindow: false` is needed in order for the viewport to be resizable
    }

    const port = this.options.cdp.port
    const versionResult = await CDP.Version({ port })
    const isHeadless = versionResult['User-Agent'].includes('Headless')

    if (viewport.height && viewport.width) {
      config.height = viewport.height
      config.width = viewport.width
    } else if (isHeadless) {
      // just apply default value in headless mode to maintain original browser viewport
      config.height = 900
      config.width = 1440
    } else {
      config.height = await evaluate(
        client,
        (() => window.innerHeight).toString(),
      )
      config.width = await evaluate(
        client,
        (() => window.innerWidth).toString(),
      )
    }

    await client.Emulation.setDeviceMetricsOverride(config)
    await client.Emulation.setVisibleSize({
      width: config.width,
      height: config.height,
    })
  }

  async process<T extends any>(command: Command): Promise<T> {
    const { runtime } = await this.runtimeClientPromise

    return (await runtime.run(command)) as T
  }

  async close(): Promise<void> {
    const { client } = await this.runtimeClientPromise

    if (this.options.cdp.closeTab) {
      CDP.Close({ id: client.target.id })
    }

    if (this.chromeInstance) {
      this.chromeInstance.kill()
    }

    await client.close()
  }
}
