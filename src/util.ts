import * as fs from 'fs'
import * as path from 'path'
import { Client, Cookie, DeviceMetrics, PdfOptions } from './types'
import * as CDP from 'chrome-remote-interface'

export const version: string = ((): string => {
  if (fs.existsSync(path.join(__dirname, '../package.json'))) {
    // development (look in /src)
    return require('../package.json').version
  } else {
    // production (look in /dist/src)
    return require('../../package.json').version
  }
})()

export async function setViewport(
  client: Client,
  viewport: DeviceMetrics = { width: 1, height: 1, scale: 1 },
): Promise<void> {
  const config: any = {
    deviceScaleFactor: 1,
    mobile: false,
    scale: viewport.scale || 1,
    fitWindow: false, // as we cannot resize the window, `fitWindow: false` is needed in order for the viewport to be resizable
  }

  const versionResult = await CDP.Version()
  const isHeadless = versionResult['User-Agent'].includes('Headless')

  if (viewport.height && viewport.width) {
    config.height = viewport.height
    config.width = viewport.width
  } else if (isHeadless) {
    // just apply default value in headless mode to maintain original browser viewport
    config.height = 900
    config.width = 1440
  } else {
    config.height = await evaluate(
      client,
      (() => window.innerHeight).toString(),
    )
    config.width = await evaluate(client, (() => window.innerWidth).toString())
  }

  await client.Emulation.setDeviceMetricsOverride(config)
  await client.Emulation.setVisibleSize({
    width: config.width,
    height: config.height,
  })
  return
}

export async function waitForNode(
  client: Client,
  selector: string,
  waitTimeout: number,
): Promise<void> {
  const { Runtime } = client
  const getNode = selector => {
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
          reject(
            new Error(`wait("${selector}") timed out after ${waitTimeout}ms`),
          )
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

export async function nodeExists(
  client: Client,
  selector: string,
): Promise<boolean> {
  const { Runtime } = client
  const exists = selector => {
    return !!document.querySelector(selector)
  }

  const expression = `(${exists})(\`${selector}\`)`

  const result = await Runtime.evaluate({
    expression,
  })

  return result.result.value
}

export async function getClientRect(client, selector): Promise<ClientRect> {
  const { Runtime } = client

  const code = selector => {
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
  const result = await Runtime.evaluate({ expression })

  if (!result.result.value) {
    throw new Error(`No element found for selector: ${selector}`)
  }

  return JSON.parse(result.result.value) as ClientRect
}

export async function click(client: Client, selector: string, scale: number) {
  const clientRect = await getClientRect(client, selector)
  const { Input } = client

  const options = {
    x: Math.round((clientRect.left + clientRect.width / 2) * scale),
    y: Math.round((clientRect.top + clientRect.height / 2) * scale),
    button: 'left',
    clickCount: 1,
  }

  await Input.dispatchMouseEvent({
    ...options,
    type: 'mousePressed',
  })
  await Input.dispatchMouseEvent({
    ...options,
    type: 'mouseReleased',
  })
}

export async function focus(client: Client, selector: string): Promise<void> {
  const { DOM } = client
  const dom = await DOM.getDocument()
  const node = await DOM.querySelector({
    nodeId: dom.root.nodeId,
    selector: selector,
  })
  await DOM.focus(node)
}

export async function evaluate<T>(
  client: Client,
  fn: string,
  ...args: any[]
): Promise<T> {
  const { Runtime } = client
  const jsonArgs = JSON.stringify(args)
  const argStr = jsonArgs.substr(1, jsonArgs.length - 2)

  const expression = `
    (() => {
      const expressionResult = (${fn})(${argStr});
      if (expressionResult && expressionResult.then) {
        expressionResult.catch((error) => { throw new Error(error); });
        return expressionResult;
      }
      return Promise.resolve(expressionResult);
    })();
  `

  const result = await Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  })

  if (result && result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception.value ||
        result.exceptionDetails.exception.description,
    )
  }

  if (result && result.result) {
    return result.result.value
  }

  return null
}

export async function type(
  client: Client,
  text: string,
  selector?: string,
): Promise<void> {
  if (selector) {
    await focus(client, selector)
    await wait(500)
  }

  const { Input } = client

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

export async function press(
  client: Client,
  keyCode: number,
  count?: number,
  modifiers?: any,
): Promise<void> {
  const { Input } = client

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

export async function getValue(
  client: Client,
  selector: string,
): Promise<string> {
  const { Runtime } = client
  const browserCode = selector => {
    return document.querySelector(selector).value
  }
  const expression = `(${browserCode})(\`${selector}\`)`
  const result = await Runtime.evaluate({
    expression,
  })

  return result.result.value
}

export async function scrollTo(
  client: Client,
  x: number,
  y: number,
): Promise<void> {
  const { Runtime } = client
  const browserCode = (x, y) => {
    return window.scrollTo(x, y)
  }
  const expression = `(${browserCode})(${x}, ${y})`
  await Runtime.evaluate({
    expression,
  })
}

export async function scrollToElement(
  client: Client,
  selector: string,
): Promise<void> {
  const clientRect = await getClientRect(client, selector)

  return scrollTo(client, clientRect.left, clientRect.top)
}

export async function setHtml(client: Client, html: string): Promise<void> {
  const { Page } = client

  const { frameTree: { frame: { id: frameId } } } = await Page.getResourceTree()
  await Page.setDocumentContent({ frameId, html })
}

export async function getCookies(
  client: Client,
  nameOrQuery?: string | Cookie,
): Promise<any> {
  const { Network } = client

  const fn = () => location.href

  const url = (await evaluate(client, `${fn}`)) as string

  const result = await Network.getCookies([url])
  const cookies = result.cookies

  if (typeof nameOrQuery !== 'undefined' && typeof nameOrQuery === 'string') {
    const filteredCookies: Cookie[] = cookies.filter(
      cookie => cookie.name === nameOrQuery,
    )
    return filteredCookies
  }
  return cookies
}

export async function getAllCookies(client: Client): Promise<any> {
  const { Network } = client

  const result = await Network.getAllCookies()
  return result.cookies
}

export async function setCookies(
  client: Client,
  cookies: Cookie[],
): Promise<void> {
  const { Network } = client

  for (const cookie of cookies) {
    await Network.setCookie({
      ...cookie,
      url: getUrlFromCookie(cookie),
    })
  }
}

export async function mousedown(
  client: Client,
  selector: string,
  scale: number,
) {
  const clientRect = await getClientRect(client, selector)
  const { Input } = client

  const options = {
    x: Math.round((clientRect.left + clientRect.width / 2) * scale),
    y: Math.round((clientRect.top + clientRect.height / 2) * scale),
    button: 'left',
    clickCount: 1,
  }

  await Input.dispatchMouseEvent({
    ...options,
    type: 'mousePressed',
  })
}

export async function mouseup(client: Client, selector: string, scale: number) {
  const clientRect = await getClientRect(client, selector)
  const { Input } = client

  const options = {
    x: Math.round((clientRect.left + clientRect.width / 2) * scale),
    y: Math.round((clientRect.top + clientRect.height / 2) * scale),
    button: 'left',
    clickCount: 1,
  }

  await Input.dispatchMouseEvent({
    ...options,
    type: 'mouseReleased',
  })
}

function getUrlFromCookie(cookie: Cookie) {
  const domain = cookie.domain.slice(1, cookie.domain.length)
  return `https://${domain}`
}

export async function deleteCookie(
  client: Client,
  name: string,
  url: string,
): Promise<void> {
  const { Network } = client

  await Network.deleteCookie({ cookieName: name, url })
}

export async function clearCookies(client: Client): Promise<void> {
  const { Network } = client

  await Network.clearBrowserCookies()
}

export async function screenshot(client: Client): Promise<string> {
  const { Page } = client

  const screenshot = await Page.captureScreenshot({ format: 'png' })

  return screenshot.data
}

export async function html(client: Client): Promise<string> {
  const { DOM } = client

  const { root: { nodeId } } = await DOM.getDocument()
  const { outerHTML } = await DOM.getOuterHTML({ nodeId })
  return outerHTML
}

export async function pdf(
  client: Client,
  options?: PdfOptions,
): Promise<string> {
  const { Page } = client

  const pdf = await Page.printToPDF(options)

  return pdf.data
}

export async function clearInput(
  client: Client,
  selector: string,
): Promise<void> {
  await wait(500)
  await focus(client, selector)

  const { Input } = client

  const text = await getValue(client, selector)

  const optionsDelete = {
    nativeVirtualKeyCode: 46,
    windowsVirtualKeyCode: 46,
  }

  const optionsBackspace = {
    nativeVirtualKeyCode: 8,
    windowsVirtualKeyCode: 8,
  }

  for (let i = 0; i < text.length; i++) {
    await Input.dispatchKeyEvent({
      ...optionsDelete,
      type: 'rawKeyDown',
    })
    Input.dispatchKeyEvent({
      ...optionsDelete,
      type: 'keyUp',
    })
    await Input.dispatchKeyEvent({
      ...optionsBackspace,
      type: 'rawKeyDown',
    })
    Input.dispatchKeyEvent({
      ...optionsBackspace,
      type: 'keyUp',
    })
  }
}

export async function setFileInput(
  client: Client,
  selector: string,
  files: string[],
): Promise<string> {
  const { DOM } = client
  const dom = await DOM.getDocument()
  const node = await DOM.querySelector({
    nodeId: dom.root.nodeId,
    selector: selector,
  })
  return await DOM.setFileInputFiles({ files: files, nodeId: node.nodeId })
}

export function getDebugOption(): boolean {
  if (
    process &&
    process.env &&
    process.env['DEBUG'] &&
    process.env['DEBUG'].includes('chromeless')
  ) {
    return true
  }

  return false
}
