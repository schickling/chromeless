import { Chrome, Command } from './types'

export default class Queue {

  private flushCount: number
  private commandQueue: {
    [flushCount: number]: Command[]
  }
  private chrome: Chrome

  constructor(chrome: Chrome) {
    this.chrome = chrome
    this.flushCount = 0
    this.commandQueue = {
      0: [],
    }
  }

  async end(): Promise<void> {
    await this.waitAll()
    await this.chrome.close()
  }

  enqueue(command: Command): void {
    this.commandQueue[this.flushCount].push(command)
  }

  async process<T extends any>(command: Command): Promise<T> {
    await this.waitAll()

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