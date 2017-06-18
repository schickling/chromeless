import { Chrome, Command } from './types'

export default class Queue {

  private commandQueue: Command[]
  private chrome: Chrome

  constructor(chrome: Chrome) {
    this.chrome = chrome
    this.commandQueue = []
  }

  async end(): Promise<void> {
    await this.waitAll()
    await this.chrome.close()
  }

  enqueue(command: Command): void {
    this.commandQueue.push(command)
  }

  async process<T extends any>(command: Command): Promise<T> {
    await this.waitAll()

    return this.chrome.process<T>(command)
  }

  private async waitAll(): Promise<void> {
    while (this.commandQueue.length > 0) {
      const job = this.commandQueue.shift()
      await this.chrome.process(job)
    }
  }

}