export interface Client {
  Network: any
  Page: any
  DOM: any
  Input: any
  Runtime: any
  Emulation: any
  close: () => void
  target: {
    id: string
  }
}

export interface DeviceMetrics {
  width: number
  height: number
  deviceScaleFactor?: number
  mobile?: boolean
  scale?: number
  screenOrientation?: ScreenOrientation
}

export interface ScreenOrientation {
  type: string
  angle: number
}

export interface RemoteOptions {
  endpointUrl: string
  apiKey?: string
}

export interface CDPOptions {
  host?: string // localhost
  port?: number // 9222
  secure?: boolean // false
  closeTab?: boolean // true
}

export interface ChromelessOptions {
  debug?: boolean // false
  waitTimeout?: number // 10000ms
  implicitWait?: boolean // false
  scrollBeforeClick?: boolean // false
  viewport?: {
    width?: number // 1440 if headless
    height?: number // 900 if headless
    scale?: number // 1
  }
  launchChrome?: boolean // auto-launch chrome (local) `true`
  cdp?: CDPOptions
  remote?: RemoteOptions | boolean
}

export interface Chrome {
  process<T extends any>(command: Command): Promise<T>
  close(): Promise<void>
}

export type Command =
  | {
      type: 'goto'
      url: string
    }
  | {
      type: 'clearCache'
    }
  | {
      type: 'setViewport'
      options: DeviceMetrics
    }
  | {
      type: 'setUserAgent'
      useragent: string
    }
  | {
      type: 'wait'
      timeout?: number
      selector?: string
      fn?: string
      args?: any[]
    }
  | {
      type: 'click'
      selector: string
    }
  | {
      type: 'returnCode'
      fn: string
      args?: any[]
    }
  | {
      type: 'returnInputValue'
      selector: string
    }
  | {
      type: 'returnExists'
      selector: string
    }
  | {
      type: 'returnValue'
      selector: string
    }
  | {
      type: 'returnScreenshot'
      selector?: string
      options?: ScreenshotOptions
    }
  | {
      type: 'returnHtml'
    }
  | {
      type: 'returnPdf'
      options?: PdfOptions
    }
  | {
      type: 'scrollTo'
      x: number
      y: number
    }
  | {
      type: 'scrollToElement'
      selector: string
    }
  | {
      type: 'setHtml'
      html: string
    }
  | {
      type: 'setExtraHTTPHeaders'
      headers: Headers
    }
  | {
      type: 'press'
      keyCode: number
      count?: number
      modifiers?: any
    }
  | {
      type: 'type'
      input: string
      selector?: string
    }
  | {
      type: 'clearCookies'
    }
  | {
      type: 'deleteCookies'
      name: string
      url: string
    }
  | {
      type: 'setCookies'
      nameOrCookies: string | Cookie | Cookie[]
      value?: string
    }
  | {
      type: 'allCookies'
    }
  | {
      type: 'cookies'
      nameOrQuery?: string | CookieQuery
    }
  | {
      type: 'mousedown'
      selector: string
    }
  | {
      type: 'mouseup'
      selector: string
    }
  | {
      type: 'focus'
      selector: string
    }
  | {
      type: 'clearInput'
      selector: string
    }
  | {
      type: 'setFileInput'
      selector: string
      files: string[]
    }

export type Headers = Record<string, string>

export interface Cookie {
  url?: string
  domain?: string
  name: string
  value: string
  path?: string
  expires?: number
  size?: number
  httpOnly?: boolean
  secure?: boolean
  session?: boolean
}

export interface CookieQuery {
  name: string
  path?: string
  expires?: number
  size?: number
  httpOnly?: boolean
  secure?: boolean
  session?: boolean
}

// https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-printToPDF
export interface PdfOptions {
  landscape?: boolean
  displayHeaderFooter?: boolean
  printBackground?: boolean
  scale?: number
  paperWidth?: number
  paperHeight?: number
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  pageRanges?: string
  ignoreInvalidPageRanges?: boolean
  filePath?: string // for internal use
}

export interface ScreenshotOptions {
  filePath?: string
  s3ObjectKeyPrefixOverride?: string //string to use as key when saving screenshots to s3
}

export type Quad = Array<number>

export interface ShapeOutsideInfo {
  bounds: Quad
  shape: Array<any>
  marginShape: Array<any>
}

export interface BoxModel {
  content: Quad
  padding: Quad
  border: Quad
  margin: Quad
  width: number
  height: number
  shapeOutside: ShapeOutsideInfo
}

export interface Viewport {
  x: number
  y: number
  width: number
  height: number
  scale: number
}
