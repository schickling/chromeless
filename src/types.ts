export interface Client {
  Network: any
  Page: any
  Input: any
  Runtime: any
  close: () => void
  target: {
    id: string
  }
}

export interface ChromelessOptions {
  useArtificialClick?: boolean
  closeTab?: boolean
  waitTimeout?: number
  runRemote?: boolean
  viewport?: any // TODO
}

export interface Chrome {
  process<T extends any>(command: Command): Promise<T>
  close(): Promise<void>
}

export type Command = {
  type: 'goto'
  url: string
} | {
  type: 'wait'
  timeout?: number
  selector?: string
  fn?: string
  args?: any[]
} | {
  type: 'click'
  selector: string
} | {
  type: 'evalCode'
  fn: string
  args?: any[]
} | {
  type: 'evalInputValue'
  selector: string
} | {
  type: 'evalExists'
  selector: string
} | {
  type: 'evalValue'
  selector: string
} | {
  type: 'evalScreenshot'
} | {
  type: 'scrollTo'
  x: number
  y: number
} | {
  type: 'press'
  keyCode: number
  count?: number
  modifiers?: any
} | {
  type: 'type'
  input: string
  selector?: string
} | {
  type: 'cookiesClearAll'
} | {
  type: 'cookiesSet'
  nameOrCookies: string | Cookie | Cookie[]
  value?: string
} | {
  type: 'cookiesGetAll'
} | {
  type: 'cookiesGet'
  nameOrQuery?: string | CookieQuery
}

interface IChromeless {
  focus(selector: string): IChromeless
  press(keyCode: number, count: number): IChromeless
  type(input: string, selector?: string): IChromeless
  screenshot(): IChromeless
  back(): IChromeless
  forward(): IChromeless
  refresh(): IChromeless
  mousedown(): IChromeless
  mouseup(): IChromeless
  mouseover(): IChromeless
  scrollTo(top: number, left?: number): IChromeless
  viewport(width: number, height: number): IChromeless
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
