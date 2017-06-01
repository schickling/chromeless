import * as CDP from 'chrome-remote-interface'
import {getPosition, nodeAppears, wait, click, type, getValue, waitForNode} from './util'

interface Options {

}

interface Client {
  Network: any
  Page: any
  Input: any
  Runtime: any
  close: () => void
}

type Instruction = (client: Client) => Promise<any>

class Daymare {
  private options: Options
  private cdp: any
  private queue: Instruction[]
  private client: Client
  private processCallback: () => Promise<any>
  private lastValue: any

  constructor(options?: Options) {
    this.options = options
    this.queue = []

    CDP(async (client) => {
      console.log('Booted the CDP client')
      this.client = client
      if (this.processCallback) {
        this.processCallback()
        this.processCallback = undefined
      }
    })
  }

  public goto(url: string): Daymare {
    this.queue.push(async ({Network, Page}) => {
      try {
        await Promise.all([Network.enable(), Page.enable()])
        await Page.navigate({url})
        await Page.loadEventFired()
        console.log('Navigated to', url)
      } catch (e) {
        console.error(e)
      }
    })
    return this
  }

  public click(selector: string): Daymare {
    this.queue.push(async (client) => {
      await click(client, selector)
      console.log('Clicked on ', selector)
    })


    return this
  }

  public type(selector: string, text: string): Daymare {
    this.queue.push(async (client) => {
      await type(client, selector, text)
      console.log(`Typed ${text} in ${selector}`)
    })
    return this
  }

  public wait(selector: string | number): Daymare {
    if (typeof selector === 'number') {
      this.queue.push(async () => {
        console.log(`Waited for ${selector}ms`)
        await wait(selector)
      })
    } else {
      this.queue.push(async (client) => {
        await waitForNode(client, selector)
        console.log(`Waited for ${selector}`)
      })
    }
    return this
  }

  public value(selector: string): Daymare {
    this.queue.push(async (client) => {
      const value = await getValue(client, selector)
      this.lastValue = value
    })

    return this
  }

  public async end(): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = async () => {
        for (const job of this.queue) {
          await job(this.client)
          await wait(100)
        }
        // await this.client.close()
        resolve(this.lastValue)
      }

      if (this.client) {
        console.log('processing directly')
        process()
      } else {
        console.log('defering process')
        this.processCallback = process
      }
    })
  }
}

const daymare = new Daymare()

daymare
  .goto('http://localhost:8064/')
  .type('#text', 'Graphcool is ultra awesome')
  .value('#text')
  .click('#submit')
  .wait('#somecrazyid')
  .end()
  .then((result) => {
    console.log('done, result:', result)
  })