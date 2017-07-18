import { Cookie, CookieQuery } from '../types'
import Queue from '../queue'
import Chromeless from './chromeless'

export default class Cookies {

  private queue: Queue
  private chromeless: Chromeless

  constructor(queue: Queue, chromeless: Chromeless) {
    this.queue = queue
    this.chromeless = chromeless
  }

  /**
   * Get the cookies for the current url
   */
  get(): Promise<Cookie[] | null>
  /**
   * Get a specific cookie for the current url
   * @param name
   */
  get(name: string): Promise<Cookie | null>
  /**
   * Get a specific cookie by query. Not implemented yet
   * @param query
   */
  get(query: CookieQuery): Promise<Cookie[] | null>
  async get(nameOrQuery?: string | CookieQuery): Promise<Cookie | Cookie[] | null> {
    if (typeof nameOrQuery !== 'undefined') {
      throw new Error('Querying cookies is not implemented yet')
    }
    return this.queue.process<Cookie[] | Cookie | null>({type: 'cookiesGet', nameOrQuery})
  }

  async getAll(): Promise<Cookie[]> {
    return this.queue.process<Cookie[]>({type: 'cookiesGetAll'})
  }

  set(name: string, value: string): Chromeless
  set(cookie: Cookie): Chromeless
  set(cookies: Cookie[]): Chromeless
  set(nameOrCookies, value?: string): Chromeless {
    this.queue.enqueue({type: 'cookiesSet', nameOrCookies, value})
    return this.chromeless
  }

  async clear(name: string): Promise<void> {
    throw new Error('Not implemented yet')
  }

  clearAll(): Chromeless {
    this.queue.enqueue({type: 'cookiesClearAll'})
    return this.chromeless
  }

}
