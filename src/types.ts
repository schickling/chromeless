export interface Client {
  Network: any
  Page: any
  Input: any
  Runtime: any
  Emulation: any
  close: () => void
  target: {
    id: string
  }
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
  viewport?: {
    width?: number // 1440 if headless
    height?: number // 900 if headless
    scale?: number // 1
  }
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
      logRequests?: boolean
    }
  | {
      type: 'wait'
      timeout?: number
      selector?: string
      fn?: Function
      url?: string
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
    }
  | {
      type: 'scrollTo'
      x: number
      y: number
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
      type: 'cookiesClearAll'
    }
  | {
      type: 'cookiesSet'
      nameOrCookies: string | Cookie | Cookie[]
      value?: string
    }
  | {
      type: 'cookiesGetAll'
    }
  | {
      type: 'cookiesGet'
      nameOrQuery?: string | CookieQuery
    }

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

export interface Request {
  url: string
  method: string
  headers: any
  postData?: string
  mixedContentType?: string
  initialPriority: string
  referrerPolicy: string
  isLinkPreload?: boolean
}

export interface Response {
  url: string
  status: number
  statusText: string
  headers: any
  headersText?: string
  mimeType: string
  requestHeaders?: any
  requestHeadersText?: string
  connectionReused: boolean
  connectionId: number
  fromDiskCache: boolean
  fromServiceWorker: boolean
  encodedDataLength: number
  timing?: any
  protocol?: string
  securityState: string
  securityDetails?: any
}

export interface RequestEvent {
  requestId: string
  loaderId: string
  documentURL: string
  request: Request
  timestamp: number
  initiator: any
  redirectResponse?: Response
}

export interface ResponseEvent {
  responseId: string,
  loaderId: string
  timestamp: number
  type: string
  response: Response
}
