import * as CDP from 'chrome-remote-interface'
import * as fetch from 'isomorphic-fetch'
import {
  wait, click, type, getValue, waitForNode, nodeExists,
  backspace, evaluate, sendKeyCode, getCookies, setCookies, clearCookies,
  screenshot,
} from './util'
import * as fs from 'fs'

export interface Options {
  useArtificialClick?: boolean
  closeTab?: boolean
  waitTimeout?: number
  runRemote?: boolean
}

interface Client {
  Network: any
  Page: any
  Input: any
  Runtime: any
  close: () => void
  target: {
    id: string
  }
}

type Instruction = {
  fn: (client: Client, ...args: any[]) => Promise<any>
  args?: { [key: string]: any }
}

class Chromeless {
  private options: Options
  private cdp: any
  private queue: Instruction[]
  private client: Client
  private processCallback: () => Promise<any>
  private lastValue: any
  private target: any
  // public static functionUrl: string = 'http://localhost:3000/package/lambda/test'
  public static functionUrl: string = 'https://dwrl0j96t5.execute-api.eu-west-1.amazonaws.com/dev/package/lambda/test'

  constructor(options?: Options) {
    this.options = {
      useArtificialClick: false,
      closeTab: true,
      waitTimeout: 10000,
      runRemote: false,
      ...options,
    }

    this.queue = []

    if (!this.options.runRemote) {
      CDP.New().then((target) => {
        this.target = target
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
  }

  public goto(url: string): Chromeless {
    this.queue.push({
      fn: async (client, url) => {
        const {Network, Page} = client
        try {
          await Promise.all([Network.enable(), Page.enable()])
          await Page.navigate({url})
          await Page.loadEventFired()
          await wait(500)
          console.log('Navigated to', url)
        } catch (e) {
          console.error(e)
        }
      },
      args: {url},
    })

    return this
  }

  public click(selector: string, artificialClick?: boolean): Chromeless {
    this.queue.push({
      fn: async (client, selector, artificialClick) => {
        const exists = await nodeExists(client, selector)
        if (!exists) {
          throw new Error(`click(): node for selector ${selector} doesn't exist`)
        }
        const fakeClick = typeof artificialClick === 'boolean' ? artificialClick : this.options.useArtificialClick
        await click(client, fakeClick, selector)
        console.log('Clicked on ', selector)
      },
      args: {
        selector,
        artificialClick: artificialClick || null,
      },
    })


    return this
  }

  public type(text: string, selector?: string): Chromeless {
    this.queue.push({
      fn: async (client, text, selector) => {
        if (selector) {
          const exists = await nodeExists(client, selector)
          if (!exists) {
            console.log('throwing')
            throw new Error(`type(): node for selector ${selector} doesn't exist`)
          }
          console.log('Node exists', exists)
        }
        await type(client, this.options.useArtificialClick, text, selector)
        console.log(`Typed ${text} in ${selector}`)
      },
      args: {
        text,
        selector: selector || null,
      },
    })
    return this
  }

  public backspace(n: number, selector?: string): Chromeless {
    this.queue.push({
      fn: async (client, n, selector) => {
        if (selector) {
          const exists = await nodeExists(client, selector)
          if (!exists) {
            throw new Error(`type(): node for selector ${selector} doesn't exist`)
          }
          console.log('Node exists', exists)
        }
        await backspace(client, this.options.useArtificialClick, n, selector)
      },
      args: {
        n,
        selector: selector || null,
      },
    })
    return this
  }

  public getCookies(url: string): Chromeless {
    this.queue.push({
      fn: async (client, url) => {
        const value = await getCookies(client, url)
        console.log('got cookies', value)
        this.lastValue = value
      },
      args: {url},
    })

    return this
  }

  public setCookies(cookies: any[], url: string): Chromeless {
    this.queue.push({
      fn: async (client, cookies, url) => {
        await setCookies(client, cookies, url)
      },
      args: {cookies, url},
    })

    return this
  }

  public clearCookies(): Chromeless {
    this.queue.push({
      fn: async (client) => {
        await clearCookies(client)
      },
    })

    return this
  }

  public sendKeyCode(keyCode: number, selector?: string, modifiers?: number): Chromeless {
    this.queue.push({
      fn: async (client, keyCode, selector, modifiers) => {
        if (selector) {
          const exists = await nodeExists(client, selector)
          if (!exists) {
            throw new Error(`type(): node for selector ${selector} doesn't exist`)
          }
          console.log('Node exists', exists)
        }
        console.log('Sending keyCode', keyCode, modifiers)
        await sendKeyCode(client, this.options.useArtificialClick, keyCode, selector, modifiers)
      },
      args: {
        keyCode,
        selector: selector || null,
        modifiers: modifiers || null,
      },
    })
    return this
  }

  public wait(selector: string | number): Chromeless {
    if (typeof selector === 'number') {
      this.queue.push({
        fn: async (client, selector) => {
          console.log(`Waiting for ${selector}ms`)
          await wait(selector)
        },
        args: {selector},
      })
    } else {
      this.queue.push({
        fn: async (client, selector) => {
          console.log(`Waiting for ${selector}`)
          await waitForNode(client, selector, this.options.waitTimeout)
          console.log(`Waited for ${selector}`)
        },
        args: {selector},
      })
    }
    return this
  }

  public evaluate(fn: string | (() => void)): Chromeless {
    this.queue.push({
      fn: async (client, fn) => {
        console.log('Evaluating', `${fn}`)
        this.lastValue = await evaluate(client, fn)
      },
      args: {fn: fn.toString()},
    })
    return this
  }

  public value(selector: string): Chromeless {
    this.queue.push({
      fn: async (client, selector) => {
        const exists = await nodeExists(client, selector)
        if (!exists) {
          throw new Error(`value: node for selector ${selector} doesn't exist`)
        }
        const value = await getValue(client, selector)
        this.lastValue = value
      },
      args: {selector},
    })

    return this
  }

  public screenshot(outputPath: string): Chromeless {
    this.queue.push({
      fn: async (client, outputPath) => {
        const value = await screenshot(client, outputPath)
      },
      args: {outputPath},
    })

    return this
  }

  public async processJobs(jobs: any[]) {
    this.queue = this.deserializeJobs(jobs)
    console.log(`Successfully deserialized ${this.queue.length} jobs`)
    return this.end()
  }

  public async end(): Promise<any> {
    if (this.options.runRemote) {
      return this.processRemote()
    } else {
      return this.processLocal()
    }
  }

  private async processRemote() {
    console.log('Requesting ' + Chromeless.functionUrl)
    const jobs = this.serializeJobs()
    const data = await fetch(Chromeless.functionUrl, {
      method: 'POST',
      body: JSON.stringify({
        jobs: this.getSerializableJobs(),
        options: this.options,
      })
    })

    const json = await data.json()

    console.log(json)
    if (json.message) {
      if (json.message === 'Internal server error') {
        console.log('Got internal server error, retrying')
        return this.processRemote()
      }
      throw new Error(`Didn't get the expected response ${json}`)
    }

    return json.result
  }

  private processLocal() {
    return new Promise((resolve, reject) => {
      const process = async () => {

        const jobs = this.queue

        for (const job of jobs) {
          try {
            let args = []
            if (job.args) {
              args = Object.keys(job.args).map(key => job.args[key])
            }
            await job.fn.apply(this, [this.client].concat(args))
          } catch (e) {
            reject(e)
          }
        }
        // await this.client.close()
        const {id} = this.target
        if (this.options.closeTab) {
          CDP.Close({id})
        }
        resolve(this.lastValue)
      }

      if (this.client) {
        return process()
      } else {
        this.processCallback = process
      }
    })
  }

  public async saveJobs(path) {
    const str = this.serializeJobs()
    fs.writeFileSync(path, str, 'utf-8')
  }

  private serializeJobs() {
    return JSON.stringify(this.getSerializableJobs(), null, 2)
  }

  private getSerializableJobs() {
    return this.queue.map(job => {
      return {
        fn: job.fn.toString(),
        args: job.args,
      }
    })
  }

  private deserializeJobs(jobs) {
    // const jobs = JSON.parse(str)
    global['_this'] = this
    return jobs.map(job => {
      const fnString = this.prepareFunction(job)
      const fn = eval(fnString)
      return {
        fn,
        args: job.args,
      }
    })
  }

  private prepareFunction(job: Instruction) {
    const body = this.extractFunctionBody(job.fn)

    const args = ['client'].concat(job.args ? Object.keys(job.args) : [])

    return `(${args}) => ${body}`
  }

  private extractFunctionBody(fn) {
    const startIndex = fn.indexOf('{')
    return fn.slice(startIndex, fn.length)
  }
}

export default Chromeless
