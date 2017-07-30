import { Chrome, Request, Response, RequestEvent, ResponseEvent } from './types'

export default class TrafficLog {

  private requests: {
    [id: string]: Request
  }

  private responses: {
    [id: string]: Response[]
  }

  constructor() {
    this.requests = {}
    this.responses = {}
    this.onRequest = this.onRequest.bind(this)
    this.onResponse = this.onResponse.bind(this)
  }

  private addRequest(id: string, request: Request): void {
    this.requests[id] = request
  }

  private addResponse(id: string, response: Response): void {
    this.responses[id].push(response)
  }

  onRequest(event: RequestEvent): void {
      this.addRequest(event.requestId, event.request)
  }

  onResponse(event: ResponseEvent): void {
    if (this.requests.hasOwnProperty(event.responseId)) {
      this.addResponse(event.responseId, event.response)
    }
  }

  async getRequests(url: string, fn: Function): Promise<any> {
    const result = []
    for (const id of Object.keys(this.requests)) {
      if (this.requests[id].url.includes(url)) {
        result.push(this.requests[id])
      }
    }
    const finished = await fn(result)
    return {requests: result, finished}
  }
}
