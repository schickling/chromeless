import { Chrome, ChromelessOptions, Command, RemoteOptions } from '../types'
import { connect as mqtt, MqttClient } from 'mqtt'
import * as cuid from 'cuid'
import * as got from 'got'

interface RemoteResult {
  value?: any
  error?: string
}

function getEndpoint(remoteOptions: RemoteOptions | boolean): RemoteOptions {
  if (typeof remoteOptions === 'object' && remoteOptions.endpointUrl) {
    return remoteOptions
  }

  if (
    process.env['CHROMELESS_ENDPOINT_URL'] &&
    process.env['CHROMELESS_ENDPOINT_API_KEY']
  ) {
    return {
      endpointUrl: process.env['CHROMELESS_ENDPOINT_URL'],
      apiKey: process.env['CHROMELESS_ENDPOINT_API_KEY'],
    }
  }

  throw new Error(
    'No Chromeless remote endpoint & API key provided. Either set as "remote" option in constructor or set as "CHROMELESS_ENDPOINT_URL" and "CHROMELESS_ENDPOINT_API_KEY" env variables.',
  )
}

export default class RemoteChrome implements Chrome {
  private options: ChromelessOptions
  private channelId: string
  private channel: MqttClient
  private connectionPromise: Promise<void>
  private TOPIC_NEW_SESSION: string
  private TOPIC_CONNECTED: string
  private TOPIC_REQUEST: string
  private TOPIC_RESPONSE: string
  private TOPIC_END: string

  constructor(options: ChromelessOptions) {
    this.options = options
    this.connectionPromise = this.initConnection()
  }

  private async initConnection(): Promise<void> {
    await new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.channel) {
          this.channel.end()
        }

        reject(
          new Error(
            "Timed out after 30sec. Connection couldn't be established.",
          ),
        )
      }, 30000)

      try {
        const { endpointUrl, apiKey } = getEndpoint(this.options.remote)
        const { body: { url, channelId } } = await got(endpointUrl, {
          headers: apiKey
            ? {
                'x-api-key': apiKey,
              }
            : undefined,
          json: true,
        })

        this.channelId = channelId

        this.TOPIC_NEW_SESSION = 'chrome/new-session'
        this.TOPIC_CONNECTED = `chrome/${channelId}/connected`
        this.TOPIC_REQUEST = `chrome/${channelId}/request`
        this.TOPIC_RESPONSE = `chrome/${channelId}/response`
        this.TOPIC_END = `chrome/${channelId}/end`

        const channel = mqtt(url, {
          will: {
            topic: 'chrome/last-will',
            payload: JSON.stringify({ channelId }),
            qos: 1,
            retain: false,
          },
        })

        this.channel = channel

        if (this.options.debug) {
          channel.on('error', error => console.log('WebSocket error', error))
          channel.on('offline', () => console.log('WebSocket offline'))
        }

        channel.on('connect', () => {
          if (this.options.debug) {
            console.log('Connected to message broker.')
          }

          channel.subscribe(this.TOPIC_CONNECTED, { qos: 1 }, () => {
            channel.on('message', async topic => {
              if (this.TOPIC_CONNECTED === topic) {
                clearTimeout(timeout)
                resolve()
              }
            })

            channel.publish(
              this.TOPIC_NEW_SESSION,
              JSON.stringify({ channelId, options: this.options }),
              { qos: 1 },
            )
          })

          channel.subscribe(this.TOPIC_END, () => {
            channel.on('message', async (topic, buffer) => {
              if (this.TOPIC_END === topic) {
                const message = buffer.toString()
                const data = JSON.parse(message)

                if (data.outOfTime) {
                  console.warn(
                    `Chromeless Proxy disconnected because it reached it's execution time limit (5 minutes).`,
                  )
                } else if (data.inactivity) {
                  console.warn(
                    'Chromeless Proxy disconnected due to inactivity (no commands sent for 30 seconds).',
                  )
                } else {
                  console.warn(
                    `Chromeless Proxy disconnected (we don't know why).`,
                    data,
                  )
                }

                await this.close()
              }
            })
          })
        })
      } catch (error) {
        console.error(error)

        reject(
          new Error('Unable to get presigned websocket URL and connect to it.'),
        )
      }
    })
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
        this.channel.publish(this.TOPIC_REQUEST, JSON.stringify(command))
      })
    })

    return promise
  }

  async close(): Promise<void> {
    this.channel.publish(
      this.TOPIC_END,
      JSON.stringify({ channelId: this.channelId, client: true }),
    )

    this.channel.end()
  }
}
