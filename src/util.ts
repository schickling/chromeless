import * as fs from 'fs'
import { Client, Cookie } from './types'
// export async function nodeAppears(client, selector) {
//   // browser code to register and parse mutations
//   const browserCode = (selector) => {
//     return new Promise((fulfill, reject) => {
//       new MutationObserver((mutations, observer) => {
//         // add all the new nodes
//         const nodes = []
//         mutations.forEach((mutation) => {
//           nodes.push(...mutation.addedNodes)
//         })
//         // fulfills if at least one node matches the selector
//         if (nodes.find((node) => node.matches(selector))) {
//           observer.disconnect()
//           fulfill()
//         }
//       }).observe(document.body, {
//         childList: true
//       })
//     })
//   }
//   // inject the browser code
//   const {Runtime} = client
//   await Runtime.evalCode({
//     expression: `(${browserCode})(\`${selector}\`)`,
//     awaitPromise: true
//   })
// }

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
          reject(new Error(`wait() timed out after ${waitTimeout}ms`))
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

  try {
    const result = await Runtime.evaluate({
      expression,
    })

    // counter intuitive: if it is a real object and not just null,
    // the chrome debugger won't return a value but return a objectId
    const exists = typeof result.result.value === 'undefined'
    return exists
  } catch (e) {
    console.error('Error while trying to run nodeExists')
    console.error(e)
  }
}

export async function getClientRect(client, selector): Promise<ClientRect> {
  const {Runtime} = client

  const code = (selector) => {
    const rect = document.querySelector(selector).getBoundingClientRect()
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

  console.log(`Clicking to (${options.x},${options.y})`)

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

export async function press(client: Client, keyCode: number, scale: number, count?: number, modifiers?: any): Promise<void> {

  // special handling for backspace
  if (keyCode === 8) {
    return backspace(client, scale, count || 1)
  }

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

export async function backspace(client: Client, n: number, scale: number, selector?: string): Promise<void> {
  if (selector) {
    await click(client, selector, scale)
    await wait(500)
  }

  const {Input} = client

  for (let i = 0; i < n; i++) {
    const options = {
      modifiers: 8,
      key: 'Backspace',
      code: 'Backspace',
      nativeVirtualKeyCode: 8,
      windowsVirtualKeyCode: 8,
    }
    await Input.dispatchKeyEvent({
      ...options,
      type: 'rawKeyDown',
    })
    await Input.dispatchKeyEvent({
      ...options,
      type: 'keyUp',
    })

    console.log('sent backspace', options)
  }
  const options = {
    type: 'rawKeyDown',
    nativeVirtualKeyCode: 46,
  }
  const res = await Input.dispatchKeyEvent(options)
}

export async function getValue(client: Client, selector: string): Promise<string> {
  const {Runtime} = client
  const browserCode = (selector) => {
    return document.querySelector(selector).value
  }
  // console.log('getting value for', selector)
  const expression = `(${browserCode})(\`${selector}\`)`
  try {
    const result = await Runtime.evaluate({
      expression,
    })
    return result.result.value
  } catch (e) {
    console.error(e)
  }
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

