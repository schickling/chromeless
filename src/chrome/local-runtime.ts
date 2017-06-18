import { Client, Command, ChromelessOptions } from '../types'
import {
  nodeExists,
  wait,
  waitForNode,
  click,
  evaluate,
  screenshot,
  type,
  getValue,
  scrollTo,
  press,
  clearCookies,
} from '../util'
import * as FormData from 'form-data'
import fetch from 'node-fetch'

export default class LocalRuntime {

  private client: Client
  private chromlessOptions: ChromelessOptions

  constructor(client: Client, chromlessOptions: ChromelessOptions) {
    this.client = client
    this.chromlessOptions = chromlessOptions
  }

  async run(command: Command): Promise<any> {
    switch (command.type) {
      case 'goto':
        return this.goto(command.url)
      case 'wait': {
        if (command.timeout) {
          return this.waitTimeout(command.timeout)
        } else if (command.selector) {
          return this.waitSelector(command.selector)
        } else {
          throw new Error('waitFn not yet implemented')
        }
      }
      case 'click':
        return this.click(command.selector)
      case 'evalCode':
        return this.evalCode(command.fn, ...command.args)
      case 'evalExists':
        return this.evalExists(command.selector)
      case 'evalScreenshot':
        return this.evalScreenshot()
      case 'evalInputValue':
        return this.evalInputValue(command.selector)
      case 'type':
        return this.type(command.input, command.selector)
      case 'press':
        return this.press(command.keyCode, command.count, command.modifiers)
      case 'scrollTo':
        return this.scrollTo(command.x, command.y)
      case 'cookiesClearAll':
        return this.cookiesClearAll()
      default:
        throw new Error(`No such command: ${command}`)
    }
  }

  private async goto(url: string): Promise<void> {
    const {Network, Page} = this.client
    await Promise.all([Network.enable(), Page.enable()])
    await Network.setUserAgentOverride({userAgent: 'chromeless'})
    await Page.navigate({url})
    await Page.loadEventFired()
    console.log('Navigated to', url)
  }

  private async waitTimeout(timeout: number): Promise<void> {
    console.log(`Waiting for ${timeout}ms`)
    await wait(timeout)
  }

  private async waitSelector(selector: string): Promise<void> {
    console.log(`Waiting for ${selector}`)
    await waitForNode(this.client, selector, this.chromlessOptions.waitTimeout)
    console.log(`Waited for ${selector}`)
  }

  private async click(selector: string): Promise<void> {
    const exists = await nodeExists(this.client, selector)
    if (!exists) {
      throw new Error(`click(): node for selector ${selector} doesn't exist`)
    }

    await click(this.client, selector)
    console.log('Clicked on ', selector)
  }

  private async evalCode<T>(fn: string, ...args: any[]): Promise<T> {
    return await evaluate(this.client, fn, ...args) as T
  }

  private async scrollTo<T>(x: number, y: number): Promise<void> {
    return scrollTo(this.client, x, y)
  }

  async type(text: string, selector?: string): Promise<void> {
    if (selector) {
      const exists = await nodeExists(this.client, selector)
      if (!exists) {
        console.log('throwing')
        throw new Error(`type(): node for selector ${selector} doesn't exist`)
      }
      console.log('Node exists', exists)
    }
    await type(this.client, text, selector)
    console.log(`Typed ${text} in ${selector}`)
  }

  // async backspace(n: number, selector?: string): Chromeless {
  //   this.enqueue({
  //     fn: async (client: Client, n: number, selector: string) => {
  //       if (selector) {
  //         const exists = await nodeExists(client, selector)
  //         if (!exists) {
  //           throw new Error(`type(): node for selector ${selector} doesn't exist`)
  //         }
  //         console.log('Node exists', exists)
  //       }
  //       await backspace(client, this.options.useArtificialClick, n, selector)
  //     },
  //     args: {
  //       n,
  //       selector: selector || null,
  //     },
  //   })
  //   return this
  // }

  // async getCookies(url: string): Chromeless {
  //   this.enqueue({
  //     fn: async (client, url) => {
  //       const value = await getCookies(client, url)
  //       console.log('got cookies', value)
  //       this.lastValue = value
  //     },
  //     args: {url},
  //   })
  //
  //   return this
  // }

  // async setCookies(cookies: any[], url: string): Chromeless {
  //   this.enqueue({
  //     fn: async (client, cookies, url) => {
  //       const result = await setCookies(client, cookies, url)
  //       console.log('Done with setting cookies')
  //       console.log(result)
  //     },
  //     args: {cookies, url},
  //   })
  //
  //   return this
  // }

  async cookiesClearAll(): Promise<void> {
    await clearCookies(this.client)
  }

  async press(keyCode: number, count?: number, modifiers?: any): Promise<void> {
    console.log('Sending keyCode', keyCode, modifiers)
    await press(this.client, keyCode, count, modifiers)
  }

  async evalExists(selector: string): Promise<boolean> {
    return await nodeExists(this.client, selector)
  }

  async evalInputValue(selector: string): Promise<string> {
    const exists = await nodeExists(this.client, selector)
    if (!exists) {
      throw new Error(`value: node for selector ${selector} doesn't exist`)
    }
    return getValue(this.client, selector)
  }

  async evalScreenshot(): Promise<string> {
    const data = await screenshot(this.client)

    // const filePath = `/tmp/${cuid()}.png`
    // fs.writeFileSync(filePath, Buffer.from(data, 'base64'))

    const form = new FormData()

    form.append('data', new Buffer(data, 'base64'), {filename: 'screen.png'})

    const response = await fetch(`https://api.graph.cool/file/v1/cj42v5dg2643y018514ociq4u`, {
      method: 'post',
      body: form,
    })

    const result = await response.json()

    return result.url
  }

}