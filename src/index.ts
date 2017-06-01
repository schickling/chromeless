import * as CDP from 'chrome-remote-interface'
import {wait, click, type, getValue, waitForNode, nodeExists, backspace, evaluate} from './util'

export interface Options {
  useArtificialClick?: boolean
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
    this.options = {
      useArtificialClick: false,
      ...options,
    }

    this.queue = []

    CDP.New().then((target) => {
      return CDP({target})
    }).then(async (client) => {
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
        await wait(500)
        console.log('Navigated to', url)
      } catch (e) {
        console.error(e)
      }
    })
    return this
  }

  public click(selector: string): Daymare {
    this.queue.push(async (client) => {
      const exists = await nodeExists(client, selector)
      if (!exists) {
        throw new Error(`click(): node for selector ${selector} doesn't exist`)
      }
      await click(client, this.options.useArtificialClick, selector)
      console.log('Clicked on ', selector)
    })


    return this
  }

  public type(text: string, selector?: string): Daymare {
    this.queue.push(async (client) => {
      if (selector) {
        const exists = await nodeExists(client, selector)
        if (!exists) {
          throw new Error(`type(): node for selector ${selector} doesn't exist`)
        }
        console.log('Node exists', exists)
      }
      await type(client, this.options.useArtificialClick, text, selector)
      console.log(`Typed ${text} in ${selector}`)
    })
    return this
  }

  public backspace(n: number, selector?: string): Daymare {
    this.queue.push(async (client) => {
      if (selector) {
        const exists = await nodeExists(client, selector)
        if (!exists) {
          throw new Error(`type(): node for selector ${selector} doesn't exist`)
        }
        console.log('Node exists', exists)
      }
      await backspace(client, this.options.useArtificialClick, n, selector)
    })
    return this
  }

  public wait(selector: string | number): Daymare {
    if (typeof selector === 'number') {
      this.queue.push(async () => {
        console.log(`Waiting for ${selector}ms`)
        await wait(selector)
      })
    } else {
      this.queue.push(async (client) => {
        console.log('Waiting for node')
        await waitForNode(client, selector)
        console.log(`Waited for ${selector}`)
      })
    }
    return this
  }

  public evaluate(fn: () => void): Daymare {
    this.queue.push(async (client) => {
      this.lastValue = await evaluate(client, fn)
    })
    return this
  }

  public value(selector: string): Daymare {
    this.queue.push(async (client) => {
      const exists = await nodeExists(client, selector)
      if (!exists) {
        throw new Error(`value: node for selector ${selector} doesn't exist`)
      }
      const value = await getValue(client, selector)
      this.lastValue = value
    })

    return this
  }

  public async end(): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = async () => {
        for (const job of this.queue) {
          try {
            await job(this.client)
            // await wait(100)
          } catch (e) {
            console.error(e)
          }
        }
        // await this.client.close()
        resolve(this.lastValue)
      }

      if (this.client) {
        process()
      } else {
        this.processCallback = process
      }
    })
  }
}

export default Daymare

// const daymare = new Daymare()
//
// daymare
//   .goto('http://localhost:8064')
//   .type('hallo', 'input')
//   .wait(1000)
//   .backspace(1, 'input')
//   .end()
//   .then((result) => {
//     console.log('done, result:', result)
//   })
//   .catch(e => {
//     console.error(e)
//   })
