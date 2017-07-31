import { Chrome, Command, ChromelessOptions, Client } from '../types'
import * as CDP from 'chrome-remote-interface'
import LocalRuntime from './local-runtime'
import { setViewport } from '../util'
import { DeviceMetrics } from '../types'

interface RuntimeClient {
  client: Client
  runtime: LocalRuntime
}

export default class LocalChrome implements Chrome {
  private options: ChromelessOptions
  private runtimeClientPromise: Promise<RuntimeClient>

  constructor(options: ChromelessOptions = {}) {
    this.options = options

    this.runtimeClientPromise = this.initRuntimeClient()
  }

  private async initRuntimeClient(): Promise<RuntimeClient> {
    const target = await CDP.New()
    const client = await CDP({ target })

    const { viewport = {} as DeviceMetrics} = this.options
    await setViewport(client, viewport as DeviceMetrics)

    const runtime = new LocalRuntime(client, this.options)

    return { client, runtime }
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

    await client.close()
  }
}
