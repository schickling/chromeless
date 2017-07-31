import * as fs from 'fs'
import * as path from 'path'
import { Client, Cookie } from './types'

export const version: string = ((): string => {
  if (fs.existsSync(path.join(__dirname, '../package.json'))) {
    // development (look in /src)
    return require('../package.json').version
  } else {
    // production (look in /dist/src)
    return require('../../package.json').version
  }
})()

export async function waitForNode(client: Client, selector: string, waitTimeout: number): Promise<void> {
  const {Runtime} = client
  const getNode = (selector) => {
    return document.querySelector(selector)
  }

  const result = await Runtime.evaluate({
    expression: `(${getNode})(\`${selector}\`)`,
  })

  if (result.result.value === null) {
    const start = new Date().getTime()
    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        if (new Date().getTime() - start > waitTimeout) {
          clearInterval(interval)
          reject(new Error(`wait("${selector}") timed out after ${waitTimeout}ms`))
        }

        const result = await Runtime.evaluate({
          expression: `(${getNode})(\`${selector}\`)`,
        })

        if (result.result.value !== null) {
          clearInterval(interval)
          resolve()
        }
      }, 500)
    })
  } else {
    return
  }
}

export async function wait(timeout: number): Promise<void> {
  return new Promise<void>((resolve, reject) => setTimeout(resolve, timeout))
}

export async function nodeExists(client: Client, selector: string): Promise<boolean> {
  const {Runtime} = client
  const exists = (selector) => {
    return document.querySelector(selector)
  }

  const expression = `(${exists})(\`${selector}\`)`

  const result = await Runtime.evaluate({
    expression,
  })

  // counter intuitive: if it is a real object and not just null,
  // the chrome debugger won't return a value but return a objectId
  return typeof result.result.value === 'undefined'
}

export async function getClientRect(client, selector): Promise<ClientRect> {
  const {Runtime} = client

  const code = (selector) => {
    const element = document.querySelector(selector)
    if (!element) {
      return undefined
    }

    const rect = element.getBoundingClientRect()
    return JSON.stringify({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      height: rect.height,
      width: rect.width,
    })
  }

  const expression = `(${code})(\`${selector}\`)`
  const result = await Runtime.evaluate({expression})

  if (!result.result.value) {
    throw new Error(`No element found for selector: ${selector}`)
  }

  return JSON.parse(result.result.value) as ClientRect
}

export async function click(client: Client, selector: string, scale: number) {
  const clientRect = await getClientRect(client, selector)
  const {Input} = client

  const options = {
    x: Math.round((clientRect.left + clientRect.width / 2) * scale),
    y: Math.round((clientRect.top + clientRect.height / 2) * scale),
    button: 'left',
    clickCount: 1,
  }

  await Input.dispatchMouseEvent({
    ...options,
    type: 'mousePressed'
  })
  await Input.dispatchMouseEvent({
    ...options,
    type: 'mouseReleased'
  })
}

export async function focus(client: Client, selector: string): Promise<void> {
  const {Runtime} = client
  const focus = (selector) => {
    return document.querySelector(selector).focus()
  }
  const expression = `(${focus})(\`${selector}\`)`

  await Runtime.evaluate({
    expression,
  })
}

export async function evaluate<T>(client: Client, fn: string, ...args: any[]): Promise<T> {
  const {Runtime} = client
  const jsonArgs = JSON.stringify(args)
  const argStr = jsonArgs.substr(1, jsonArgs.length - 2)
  const expression = `(${fn})(${argStr})`

  const result = await Runtime.evaluate({
    expression,
  })
  return result.result.value
}

export async function type(client: Client, text: string, selector?: string): Promise<void> {
  if (selector) {
    await focus(client, selector)
    await wait(500)
  }

  const {Input} = client

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const options = {
      type: 'char',
      text: char,
      unmodifiedText: char,
    }
    await Input.dispatchKeyEvent(options)
  }
}

export async function press(client: Client, keyCode: number, count?: number, modifiers?: any): Promise<void> {

  const {Input} = client

  if (count === undefined) {
    count = 1
  }

  const options = {
    nativeVirtualKeyCode: keyCode,
    windowsVirtualKeyCode: keyCode,
  }

  if (modifiers) {
    options['modifiers'] = modifiers
  }

  for (let i = 0; i < count; i++) {
    await Input.dispatchKeyEvent({
      ...options,
      type: 'rawKeyDown',
    })
    await Input.dispatchKeyEvent({
      ...options,
      type: 'keyUp',
    })
  }
}

export async function getValue(client: Client, selector: string): Promise<string> {
  const {Runtime} = client
  const browserCode = (selector) => {
    return document.querySelector(selector).value
  }
  const expression = `(${browserCode})(\`${selector}\`)`
  const result = await Runtime.evaluate({
    expression,
  })

  return result.result.value
}

export async function scrollTo(client: Client, x: number, y: number): Promise<void> {
  const {Runtime} = client
  const browserCode = (x, y) => {
    return window.scrollTo(x, y)
  }
  const expression = `(${browserCode})(${x}, ${y})`
  await Runtime.evaluate({
    expression,
  })
}

export async function getCookies(client: Client, nameOrQuery?: string | Cookie): Promise<any> {
  if (nameOrQuery) {
    throw new Error('Not yet implemented')
  }

  const {Network} = client

  const fn = () => location.href

  const url = await evaluate(client, `${fn}`) as string

  const result = await Network.getCookies([url])
  return result.cookies
}

export async function getAllCookies(client: Client): Promise<any> {
  const {Network} = client

  const result = await Network.getAllCookies()
  return result.cookies
}

export async function setCookies(client: Client, cookies: Cookie[]): Promise<void> {
  const {Network} = client

  for (const cookie of cookies) {
    await Network.setCookie({
      ...cookie,
      url: getUrlFromCookie(cookie)
    })
  }
}

function getUrlFromCookie(cookie: Cookie) {
  const domain = cookie.domain.slice(1, cookie.domain.length)
  return `https://${domain}`
}

export async function clearCookies(client: Client): Promise<void> {
  const {Network} = client

  await Network.clearBrowserCookies()
}

export async function screenshot(client: Client): Promise<string> {
  const {Page} = client

  const screenshot = await Page.captureScreenshot({format: 'png'})

  return screenshot.data
}

export function getDebugOption(): boolean {
  if (process && process.env && process.env['DEBUG'] && process.env['DEBUG'].includes('chromeless')) {
    return true
  }

  return false
}

