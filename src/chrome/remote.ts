import { Chrome, ChromelessOptions, Command } from '../types'
import { Lambda } from 'aws-sdk'
import { Realtime, ablyLib } from 'ably'
import * as cuid from 'cuid'

export interface Props {
  lambdaFunctionName: string
  chromelessOptions: ChromelessOptions
}

interface RemoteResult {
  value?: any
  error?: string
}

export default class RemoteChrome implements Chrome {

  private lambdaFunctionName: string
  private chromelessOptions: ChromelessOptions
  private channelName: string
  private channel: ablyLib.RealtimeChannel
  private ably: Realtime
  private lambdaPromise: Promise<void>
  private connectionPromise: Promise<void>

  constructor(props: Props) {
    this.lambdaFunctionName = props.lambdaFunctionName
    this.chromelessOptions = props.chromelessOptions

    this.channelName = cuid()
    this.ably = new Realtime('eiPuOw.DUAicQ:yq9jJ5164vdtBFIA')
    this.channel = this.ably.channels.get(this.channelName)

    this.lambdaPromise = this.initLambda()
    this.connectionPromise = this.initConnection()
  }

  private async initLambda(): Promise<void> {
    const Payload = JSON.stringify({
      body: JSON.stringify({
        options: this.chromelessOptions,
        pusherChannelName: this.channelName,
      })
    })

    const lambda = new Lambda({
      region: process.env.AWS_REGION || 'eu-west-1',
    })

    await lambda.invoke({
      FunctionName: this.lambdaFunctionName,
      Payload,
    }).promise()
  }

  private async initConnection(): Promise<void> {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          reject(new Error('Timed out after 30sec. Connection couldn\'t be established.'))
        },
        30000
      ) // give up after 10sec

      this.channel.subscribe('connected', () => {
        clearTimeout(timeout)
        this.channel.unsubscribe('connected')
        resolve()
      })
    })
  }

  async process<T extends any>(command: Command): Promise<T> {
    // wait until lambda connection is established
    await this.connectionPromise

    console.log(`Running remotely: ${JSON.stringify(command)}`)

    const promise = new Promise<T>((resolve, reject) => {
      this.channel.subscribe('response', data => {
        this.channel.unsubscribe('response')

        const result = JSON.parse(data.data) as RemoteResult

        if (result.error) {
          reject(result.error)
        } else if (result.value) {
          resolve(result.value)
        } else {
          resolve()
        }
      })
    })

    this.channel.publish('request', JSON.stringify(command))

    return promise
  }

  async close(): Promise<void> {
    this.channel.publish('end', '')
    this.ably.close()

    const timeout = setTimeout(
      () => {
        throw new Error('End timed out after 10 seconds without response from Lambda')
      },
      30000
    )

    await this.lambdaPromise

    clearTimeout(timeout)
  }

}
