import { Chrome, ChromelessOptions, Command, RemoteOptions } from '../types'
import { Lambda, Credentials } from 'aws-sdk'
import { connect as mqtt, MqttClient } from 'mqtt'
import * as cuid from 'cuid'
import * as got from 'got'

interface RemoteResult {
  value?: any
  error?: string
}

export default class RemoteChrome implements Chrome {
  private options: ChromelessOptions
  private channelId: string
  private channel: MqttClient
  private lambdaPromise: Promise<void>
  private connectionPromise: Promise<void>
  private TOPIC_CONNECTED: string
  private TOPIC_REQUEST: string
  private TOPIC_RESPONSE: string
  private TOPIC_END: string

  constructor(options: ChromelessOptions) {
    this.options = options

    //this.channelTopic = cuid()
    //this.lambdaPromise = this.initLambda(options.remote)
    this.connectionPromise = this.initConnection()
  }

  /*
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
  */

  private async initConnection(): Promise<void> {
    await new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            "Timed out after 30sec. Connection couldn't be established."
          )
        )
      }, 30000) // give up after 30sec

      try {
        const { body: { url, channelId } } = await got(
          getEndpoint(this.options.remote),
          {
            json: true,
          }
        )
        this.channelId = channelId
        this.TOPIC_CONNECTED = `${channelId}/connected`
        this.TOPIC_REQUEST = `${channelId}/request`
        this.TOPIC_RESPONSE = `${channelId}/response`
        this.TOPIC_END = `${channelId}/end`

        const channel = mqtt(url, {
          will: {
            topic: 'last-will',
            payload: channelId,
            qos: 1,
            retain: false,
          },
        })

        this.channel = channel

        // @TODO just... remove this.
        if (true || this.options.debug) {
          channel.on('error', error => console.log('WebSocket error', error))
          channel.on('packetsend', packet =>
            console.log('WebSocket packet sent', packet)
          )
          channel.on('packetreceive', packet =>
            console.log('WebSocket packet received', packet)
          )
          channel.on('offline', () => console.log('WebSocket offline'))
        }

        channel.on('connect', () => {
          console.log('Connected to AWS IoT Broker')

          channel.subscribe(this.TOPIC_CONNECTED, { qos:1}, () => {
            channel.on('message', async topic => {
              if (this.TOPIC_CONNECTED === topic) {
                clearTimeout(timeout)
                resolve()
              }
            })
          })
        })
      } catch (error) {
        reject(
          new Error('Unable to get presigned websocket URL and connect to it.')
        )
      }
    })
  }

  async getTargetId(): Promise<string> {
    await this.initConnection

    return this.channelId
  }

  async process<T extends any>(command: Command): Promise<T> {
    // wait until lambda connection is established
    await this.connectionPromise

    if (this.options.debug) {
      console.log(`Running remotely: ${JSON.stringify(command)}`)
    }

    const promise = new Promise<T>((resolve, reject) => {
      this.channel.subscribe(this.TOPIC_RESPONSE, () => {
        this.channel.on('message', (topic, buffer) => {
          if (this.TOPIC_RESPONSE === topic) {
            const message = buffer.toString()
            const result = JSON.parse(message) as RemoteResult

            if (result.error) {
              reject(result.error)
            } else if (result.value) {
              resolve(result.value)
            } else {
              resolve()
            }
          }
        })
      })
    })

    this.channel.publish(this.TOPIC_REQUEST, JSON.stringify(command))

    return promise
  }

  async close(): Promise<void> {
    this.channel.publish(this.TOPIC_END, 'end')
    this.channel.end()

    const timeout = setTimeout(() => {
      throw new Error(
        'End timed out after 30 seconds without response from Lambda'
      )
    }, 30000)

    clearTimeout(timeout)
  }
}

function getEndpoint(remoteOptions: RemoteOptions | boolean): string {
  if (typeof remoteOptions === 'object' && remoteOptions.endpoint) {
    return remoteOptions.endpoint
  }

  if (process.env['CHROMELESS_REMOTE_ENDPOINT']) {
    return process.env['CHROMELESS_REMOTE_ENDPOINT']
  }

  throw new Error(
    'No Chromeless remote endpoint provided. Either set as `remote` option in constructor or set as `CHROMELESS_REMOTE_ENDPOINT` env variable.'
  )
}
