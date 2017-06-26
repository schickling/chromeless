import ChromeLocal from '../chrome/local'
import ChromeRemote from '../chrome/remote'
import Queue from '../queue'
import { ChromelessOptions, Command } from '../types'
import Eval from './eval'
import Cookies from './cookies'

export default class Chromeless {

  private queue: Queue

  eval: Eval
  cookies: Cookies

  constructor(options?: ChromelessOptions) {
    const chromelessOptions = {
      closeTab: true,
      waitTimeout: 10000,
      runRemote: false,
      ...options,
    }

    const lambdaFunctionName: string = 'chromeless-serverless-dev-Chromeless'

    const chrome = options.runRemote
      ? new ChromeRemote({chromelessOptions, lambdaFunctionName})
      : new ChromeLocal({chromelessOptions: options})

    this.queue = new Queue(chrome)
    this.eval = new Eval(this.queue)
    this.cookies = new Cookies(this.queue)
  }

  goto(url: string): Chromeless {
    this.queue.enqueue({type: 'goto', url})

    return this
  }

  click(selector: string): Chromeless {
    this.queue.enqueue({type: 'click', selector})

    return this
  }

  wait(timeout: number): Chromeless
  wait(selector: string): Chromeless
  wait(fn: (...args: any[]) => boolean, ...args: any[]): Chromeless
  wait(firstArg, ...args: any[]): Chromeless {
    switch (typeof firstArg) {
      case 'number': {
        this.queue.enqueue({type: 'wait', timeout: firstArg})
        break
      }
      case 'string': {
        this.queue.enqueue({type: 'wait', selector: firstArg})
        break
      }
      case 'function': {
        this.queue.enqueue({type: 'wait', fn: firstArg, args})
        break
      }
      default:
        throw new Error(`Invalid wait arguments: ${firstArg} ${args}`)
    }

    return this
  }

  focus(selector: string): Chromeless {
    throw new Error('Not implemented yet')
  }

  press(keyCode: number, count?: number, modifiers?: any): Chromeless {
    this.queue.enqueue({type: 'press', keyCode, count, modifiers})

    return this
  }

  type(input: string, selector?: string): Chromeless {
    this.queue.enqueue({type: 'type', input, selector})

    return this
  }

  back(): Chromeless {
    throw new Error('Not implemented yet')
  }

  forward(): Chromeless {
    throw new Error('Not implemented yet')
  }

  refresh(): Chromeless {
    throw new Error('Not implemented yet')
  }

  mousedown(): Chromeless {
    throw new Error('Not implemented yet')
  }

  mouseup(): Chromeless {
    throw new Error('Not implemented yet')
  }

  mouseover(): Chromeless {
    throw new Error('Not implemented yet')
  }

  scrollTo(x: number, y: number): Chromeless {
    this.queue.enqueue({type: 'scrollTo', x, y})

    return this
  }

  viewport(width: number, height: number): Chromeless {
    throw new Error('Not implemented yet')
  }

  async end(): Promise<void> {
    await this.queue.end()
  }
}
