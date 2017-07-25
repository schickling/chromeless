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
  endpoint: string
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
