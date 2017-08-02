import { Chrome, Command } from './types'

export default class Queue {
  private flushCount: number
  private commandQueue: {
    [flushCount: number]: Command[]
  }
  private chrome: Chrome
  private lastWaitAll: Promise<void>

  constructor(chrome: Chrome) {
    this.chrome = chrome
    this.flushCount = 0
    this.commandQueue = {
      0: [],
    }
  }

  async end(): Promise<void> {
    this.lastWaitAll = this.waitAll()
    await this.lastWaitAll

    await this.chrome.close()
  }

  enqueue(command: Command): void {
    this.commandQueue[this.flushCount].push(command)
  }

  async process<T extends any>(command: Command): Promise<T> {
    // with lastWaitAll we build a promise chain
    // already change the pointer to lastWaitAll for the next .process() call
    // after the pointer is set, wait for the previous tasks
    // then wait for the own pointer (the new .lastWaitAll)
    if (this.lastWaitAll) {
      const lastWaitAllTmp = this.lastWaitAll
      this.lastWaitAll = this.waitAll()
      await lastWaitAllTmp
    } else {
      this.lastWaitAll = this.waitAll()
    }

    await this.lastWaitAll

    return this.chrome.process<T>(command)
  }

  private async waitAll(): Promise<void> {
    const previousFlushCount = this.flushCount

    this.flushCount++
    this.commandQueue[this.flushCount] = []

    for (const command of this.commandQueue[previousFlushCount]) {
      await this.chrome.process(command)
    }
  }
}
