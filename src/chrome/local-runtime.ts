import * as AWS from 'aws-sdk'
import { Client, Command, ChromelessOptions, Cookie, CookieQuery } from '../types'
import * as cuid from 'cuid'
import * as fs from 'fs'
import {
  nodeExists,
  wait,
  waitForNode,
  click,
  evaluate,
  screenshot,
  getHtml,
  type,
  getValue,
  scrollTo,
  setHtml,
  press,
  setViewport,
  clearCookies,
  getCookies,
  setCookies,
  getAllCookies,
  version,
  mousedown,
  mouseup,
  focus
} from '../util'

export default class LocalRuntime {

  private client: Client
  private chromelessOptions: ChromelessOptions

  constructor(client: Client, chromelessOptions: ChromelessOptions) {
    this.client = client
    this.chromelessOptions = chromelessOptions
  }

  async run(command: Command): Promise<any> {
    switch (command.type) {
      case 'goto':
        return this.goto(command.url)
        case 'setViewport':
          return setViewport(this.client, command.options)
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
      case 'returnCode':
        return this.returnCode(command.fn, ...command.args)
      case 'returnExists':
        return this.returnExists(command.selector)
      case 'returnScreenshot':
        return this.returnScreenshot()
      case 'returnHtml':
        return this.returnHtml()
      case 'returnInputValue':
        return this.returnInputValue(command.selector)
      case 'type':
        return this.type(command.input, command.selector)
      case 'press':
        return this.press(command.keyCode, command.count, command.modifiers)
      case 'scrollTo':
        return this.scrollTo(command.x, command.y)
      case 'setHtml':
        return this.setHtml(command.html)
      case 'cookiesClearAll':
        return this.cookiesClearAll()
      case 'cookiesGet':
        return this.cookiesGet(command.nameOrQuery)
      case 'cookiesGetAll':
        return this.cookiesGetAll()
      case 'cookiesSet':
        return this.cookiesSet(command.nameOrCookies, command.value)
      case 'mousedown':
        return this.mousedown(command.selector)
      case 'mouseup':
        return this.mousup(command.selector)
      case 'focus':
        return this.focus(command.selector)
      default:
        throw new Error(`No such command: ${JSON.stringify(command)}`)
    }
  }

  private async goto(url: string): Promise<void> {
    const {Network, Page} = this.client
    await Promise.all([Network.enable(), Page.enable()])
    await Network.setUserAgentOverride({userAgent: `Chromeless ${version}`})
    await Page.navigate({url})
    await Page.loadEventFired()
    this.log(`Navigated to ${url}`)
  }

  private async waitTimeout(timeout: number): Promise<void> {
    this.log(`Waiting for ${timeout}ms`)
    await wait(timeout)
  }

  private async waitSelector(selector: string): Promise<void> {
    this.log(`Waiting for ${selector}`)
    await waitForNode(this.client, selector, this.chromelessOptions.waitTimeout)
    this.log(`Waited for ${selector}`)
  }

  private async click(selector: string): Promise<void> {
    if (this.chromelessOptions.implicitWait) {
      this.log(`click(): Waiting for ${selector}`)
      await waitForNode(this.client, selector, this.chromelessOptions.waitTimeout)
    }

    const exists = await nodeExists(this.client, selector)
    if (!exists) {
      throw new Error(`click(): node for selector ${selector} doesn't exist`)
    }

    const {scale} = this.chromelessOptions.viewport
    await click(this.client, selector, scale)
    this.log(`Clicked on ${selector}`)
  }

  private async returnCode<T>(fn: string, ...args: any[]): Promise<T> {
    return await evaluate(this.client, fn, ...args) as T
  }

  private async scrollTo<T>(x: number, y: number): Promise<void> {
    return scrollTo(this.client, x, y)
  }

  private async mousedown(selector: string): Promise<void> {
      if (this.chromelessOptions.implicitWait) {
          this.log(`mousedown(): Waiting for ${selector}`)
          await waitForNode(this.client, selector, this.chromelessOptions.waitTimeout)
      }

      const exists = await nodeExists(this.client, selector)
      if (!exists) {
          throw new Error(`mousedown(): node for selector ${selector} doesn't exist`)
      }

      const {scale} = this.chromelessOptions.viewport
      await mousedown(this.client, selector, scale)
      this.log(`Mousedown on ${selector}`)
  }

  private async mousup(selector: string): Promise<void> {
      if (this.chromelessOptions.implicitWait) {
          this.log(`mouseup(): Waiting for ${selector}`)
          await waitForNode(this.client, selector, this.chromelessOptions.waitTimeout)
      }

      const exists = await nodeExists(this.client, selector)
      if (!exists) {
          throw new Error(`mouseup(): node for selector ${selector} doesn't exist`)
      }

      const {scale} = this.chromelessOptions.viewport
      await mouseup(this.client, selector, scale)
      this.log(`Mouseup on ${selector}`)
  }

  private async setHtml(html: string): Promise<void> {
    await setHtml(this.client, html)
  }

  private async focus(selector: string): Promise<void> {
      if (this.chromlessOptions.implicitWait) {
          this.log(`focus(): Waiting for ${selector}`)
          await waitForNode(this.client, selector, this.chromlessOptions.waitTimeout)
      }

      const exists = await nodeExists(this.client, selector)
      if (!exists) {
          throw new Error(`focus(): node for selector ${selector} doesn't exist`)
      }

      await focus(this.client, selector)
      this.log(`Focus on ${selector}`)
  }

  async type(text: string, selector?: string): Promise<void> {
    if (selector) {
      if (this.chromelessOptions.implicitWait) {
        this.log(`type(): Waiting for ${selector}`)
        await waitForNode(this.client, selector, this.chromelessOptions.waitTimeout)
      }

      const exists = await nodeExists(this.client, selector)
      if (!exists) {
        throw new Error(`type(): Node not found for selector: ${selector}`)
      }
    }
    await type(this.client, text, selector)
    this.log(`Typed ${text} in ${selector}`)
  }

  async cookiesGet(nameOrQuery?: string | CookieQuery): Promise<Cookie[]> {
    return await getCookies(this.client, nameOrQuery as string | undefined)
  }

  async cookiesGetAll(): Promise<Cookie[]> {
    return await getAllCookies(this.client)
  }

  async cookiesSet(nameOrCookies: string | Cookie | Cookie[], value?: string): Promise<void> {
    if (typeof nameOrCookies !== 'string' && !value) {
      const cookies = Array.isArray(nameOrCookies) ? nameOrCookies : [nameOrCookies]
      return await setCookies(this.client, cookies)
    }

    if (typeof nameOrCookies === 'string' && typeof value === 'string') {
      const fn = () => location.href
      const url = await evaluate(this.client, `${fn}`) as string
      const cookie: Cookie = {
        url,
        name: nameOrCookies,
        value,
      }
      return await setCookies(this.client, [cookie])
    }

    throw new Error(`cookiesSet(): Invalid input ${nameOrCookies}, ${value}`)
  }

  async cookiesClearAll(): Promise<void> {
    await clearCookies(this.client)
    this.log('Cookies cleared')
  }

  async press(keyCode: number, count?: number, modifiers?: any): Promise<void> {
    this.log(`Sending keyCode ${keyCode} (modifiers: ${modifiers})`)
    await press(this.client, keyCode, count, modifiers)
  }

  async returnExists(selector: string): Promise<boolean> {
    return await nodeExists(this.client, selector)
  }

  async returnInputValue(selector: string): Promise<string> {
    const exists = await nodeExists(this.client, selector)
    if (!exists) {
      throw new Error(`value: node for selector ${selector} doesn't exist`)
    }
    return getValue(this.client, selector)
  }

  // Returns the S3 url or local file path
  async returnScreenshot(): Promise<string> {
    const data = await screenshot(this.client)

    // check if S3 configured
    if (process.env['CHROMELESS_S3_BUCKET_NAME'] && process.env['CHROMELESS_S3_BUCKET_URL']) {
      const s3Path = `${cuid()}.png`
      const s3 = new AWS.S3()
      await s3.putObject({
        Bucket: process.env['CHROMELESS_S3_BUCKET_NAME'],
        Key: s3Path,
        ContentType: 'image/png',
        ACL: 'public-read',
        Body: new Buffer(data, 'base64'),
      }).promise()

      return `https://${process.env['CHROMELESS_S3_BUCKET_URL']}/${s3Path}`
    }

    // write to `/tmp` instead
    else {
      const filePath = `/tmp/${cuid()}.png`
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'))

      return filePath
    }
  }

  async returnHtml(): Promise<string> {
    return await getHtml(this.client)
  }

  private log(msg: string): void {
    if (this.chromelessOptions.debug) {
      console.log(msg)
    }
  }

}
