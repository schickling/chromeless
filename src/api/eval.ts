import Queue from '../queue'

export default class Eval {

  private queue: Queue

  constructor(queue: Queue) {
    this.queue = queue
  }

  code<T extends any>(fn: (...args: any[]) => T, ...args: any[]): Promise<T> {
    return this.queue.process<T>({type: 'evalCode', fn: fn.toString(), args})
  }

  inputValue(selector: string): Promise<string> {
    return this.queue.process<string>({type: 'evalInputValue', selector})
  }

  exists(selector: string): Promise<boolean> {
    return this.queue.process<boolean>({type: 'evalExists', selector})
  }

  screenshot(): Promise<string> {
    return this.queue.process<string>({type: 'evalScreenshot'})
  }
}
