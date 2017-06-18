import { Cookie, CookieQuery } from '../types'
import Queue from '../queue'

export default class Cookies {

  private queue: Queue

  constructor(queue: Queue) {
    this.queue = queue
  }

  get(name: string): Promise<Cookie | null>
  get(query: CookieQuery): Promise<Cookie | null>
  async get(nameOrQuery: string | CookieQuery): Promise<Cookie | null> {
    return null
  }

  async getAll(): Promise<Cookie[]> {
    return []
  }

  set(name: string, value: string): Promise<void>
  set(cookie: Cookie): Promise<void>
  async set(nameOrCookie, value?: string): Promise<void> {
  }

  async clear(name: string): Promise<void> {
  }

  async clearAll(): Promise<void> {
    this.queue.enqueue({type: 'cookiesClearAll'})
  }

}
