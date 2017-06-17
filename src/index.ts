import * as CDP from 'chrome-remote-interface'
import * as fetch from 'isomorphic-fetch'
import * as FormData from 'form-data'

import {
  wait, click, type, getValue, waitForNode, nodeExists,
  backspace, evaluate, sendKeyCode, getCookies, setCookies, clearCookies,
  screenshot,
} from './util'
import * as fs from 'fs'
import {Lambda} from 'aws-sdk'

export interface Options {
  useArtificialClick?: boolean
  closeTab?: boolean
  waitTimeout?: number
  runRemote?: boolean
  accessKeyId?: string
  secretAccessKey?: string
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
  private lambda: Lambda
  public static lambdaFunctionName: string = 'testless-dev-test'
  public static screenshotProjectId: string = 'asdf'

  constructor(options?: Options) {
    this.options = {
      useArtificialClick: false,
      closeTab: true,
      waitTimeout: 10000,
      runRemote: false,
      ...options,
    }

    this.queue = []

    this.lambda = new Lambda({
      region: process.env.AWS_REGION || 'eu-west-1',
      accessKeyId: options.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: options.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    })

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
    console.log('Going to ' + url)
    this.queue.push({
      fn: async (client, url) => {
        const {Network, Page} = client
        try {
          await Promise.all([Network.enable(), Page.enable()])
          await Network.setUserAgentOverride({ userAgent: 'chromeless' })
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
        const result = await setCookies(client, cookies, url)
        console.log('Done with setting cookies')
        console.log(result)
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

  public screenshot(): Chromeless {
    this.queue.push({
      fn: async (client, outputPath) => {
        const data = await screenshot(client)

        const form = new FormData()

        form.append('data', new Buffer(data, 'base64'))

        console.log('uploading screenshot')
        fetch(
          `https://api.graph.cool/file/v1/asdf`,
          {
            type: 'POST',
            body: form,
          },
        )
          .then(res => res.json())
          .then(res => {
            console.log('uploaded screenshot')
            console.log(res)
          })
          .catch(e => {
            console.error('Error uploading screenshot')
          })
      },
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
    const jobs = this.serializeJobs()

    const Payload = JSON.stringify({
      body: JSON.stringify({
        jobs: this.getSerializableJobs(),
        options: this.options,
      })
    })

    try {
      const result = await this.invokeFunction(Payload)
      if (result === null) {
        console.log('Result is null, retry')
        return await this.processRemote()
      } else {
        return result
      }
    } catch (e) {
      console.log('getting an error', e)
      if (e.message === 'Internal server error') {
        return await this.processRemote()
      } else {
        throw e
      }
    }
  }

  private async invokeFunction(Payload) {
    return new Promise((resolve, reject) => {
      console.log('Invoking lambda function ' + Chromeless.lambdaFunctionName)
      this.lambda.invoke({
        FunctionName: Chromeless.lambdaFunctionName,
        Payload,
      }, (err, data) => {
        if (err) {
          console.log('received error from lambda function', err)
          reject(err)
        } else {
          console.log(data)
          const response = data.Payload.toString()
          console.log(response)
          const json = JSON.parse(response)
          console.log('received json from lambda function', json)
          let result = null
          try {
            result = JSON.parse(json.body).result
          } catch (e) {
            //
          }
          console.log('Result of invocation', result)
          resolve(result)
        }
      })
    })
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
            return reject(e)
          }
        }

        if (this.options.closeTab) {
          const {id} = this.target
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
