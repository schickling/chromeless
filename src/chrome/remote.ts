import { Chrome, ChromelessOptions, Command, RemoteOptions } from '../types'
import { Lambda, Credentials } from 'aws-sdk'
import { Realtime, ablyLib } from 'ably'
import * as cuid from 'cuid'

interface RemoteResult {
  value?: any
  error?: string
}

export default class RemoteChrome implements Chrome {

  private options: ChromelessOptions
  private channelName: string
  private channel: ablyLib.RealtimeChannel
  private ably: Realtime
  private lambdaPromise: Promise<void>
  private connectionPromise: Promise<void>

  constructor(options: ChromelessOptions) {
    this.options = options

    this.channelName = cuid()
    this.ably = new Realtime('eiPuOw.DUAicQ:yq9jJ5164vdtBFIA')
    this.channel = this.ably.channels.get(this.channelName)

    this.lambdaPromise = this.initLambda(options.remote)
    this.connectionPromise = this.initConnection()
  }

  private async initLambda(remoteOptions: RemoteOptions | boolean): Promise<void> {
    const Payload = JSON.stringify({
      body: JSON.stringify({
        options: this.options,
        pusherChannelName: this.channelName,
      })
    })

    const lambdaOptions: Lambda.Types.ClientConfiguration = {}

    if (typeof remoteOptions === 'object') {
      if (remoteOptions.credentials) {
        lambdaOptions.credentials = new Credentials(remoteOptions.credentials.accessKeyId, remoteOptions.credentials.secretAccessKey)
      }

      if (remoteOptions.region) {
        lambdaOptions.region = remoteOptions.region
      }
    }

    const lambda = new Lambda(lambdaOptions)

    await lambda.invoke({
      FunctionName: getFunctionName(remoteOptions),
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

    if (this.options.debug) {
      console.log(`Running remotely: ${JSON.stringify(command)}`)
    }

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

function getFunctionName(remoteOptions: RemoteOptions | boolean): string {
  if (typeof remoteOptions === 'object' && remoteOptions.functionName) {
    return remoteOptions.functionName
  }

  if (process.env['CHROMELESS_LAMBDA_FUNCTION_NAME']) {
    return process.env['CHROMELESS_LAMBDA_FUNCTION_NAME']
  }

  throw new Error('No AWS Lambda function name provided. Either set as `remote` option in constructor or set as `CHROMELESS_LAMBDA_FUNCTION_NAME` env variable.')
}
