import * as CDP from 'chrome-remote-interface'
import {wait, click, type, getValue, waitForNode, nodeExists, backspace, evaluate, sendKeyCode} from './util'
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
      args: {selector, artificialClick},
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
      args: {text, selector},
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
      args: {n, selector},
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
      args: {keyCode, selector, modifiers},
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

  public async end(): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = async () => {

        // let jobs = this.queue
        let jobs

        try {
          const jobsStr = fs.readFileSync('jobs.json')
          jobs = this.deserializeJobs(jobsStr)
        } catch (e) {
          reject(e)
        }

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

      if (this.options.runRemote) {
        console.log(this.serializeJobs())
        fs.writeFileSync('jobs.json', this.serializeJobs(), 'utf-8')
      } else {
        if (this.client) {
          return process()
        } else {
          this.processCallback = process
        }
      }
    })
  }

  private serializeJobs() {
    return JSON.stringify(this.queue.map(job => {
      return {
        fn: job.fn.toString(),
        args: job.args,
      }
    }), null, 2)
  }

  private deserializeJobs(str) {
    const jobs = JSON.parse(str)
    global['_this'] = this
    return jobs.map(job => {
      console.log('trying to deserialize')
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

const daymare = new Chromeless({
  closeTab: false,
  runRemote: false,
})

console.log('hi')

daymare
  .goto('http://localhost:8064')
  .click('#submit')
  .wait('div')
  .end()
  .then((result) => {
    console.log('done, result:', result)
  })
  .catch(e => {
    console.error(e)
  })
