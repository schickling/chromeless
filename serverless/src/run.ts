import { LocalChrome, Queue, ChromelessOptions } from 'chromeless'
import { connect as mqtt, MqttClient } from 'mqtt'
import { createPresignedURL, debug } from './utils'

export default async (
  { channelId, options },
  context,
  callback,
  chromeInstance
): Promise<void> => {
  debug('function invoked with event data: ', channelId, options)

  const chrome = new LocalChrome({
    ...options,
    remote: false,
    cdp: { closeTab: true },
  })

  const queue = new Queue(chrome)

  const TOPIC_CONNECTED = `chrome/${channelId}/connected`
  const TOPIC_REQUEST = `chrome/${channelId}/request`
  const TOPIC_RESPONSE = `chrome/${channelId}/response`
  const TOPIC_END = `chrome/${channelId}/end`

  const client = mqtt(createPresignedURL())

  if (process.env.DEBUG) {
    client.on('error', error => debug('WebSocket error', error))
    client.on('offline', () => debug('WebSocket offline'))
  }

  const end = async () => {
    await queue.end()
    await chrome.close()
    await chromeInstance.kill()
    client.unsubscribe(TOPIC_END)
    client.end()
  }

  const newTimeout = () => setTimeout(async () => {
    callback('Timed out after 30sec. No requests received.')
    await end()
    process.exit()
  }, 30000)

  client.on('connect', () => {
    let timeout

    debug('Connected to AWS IoT broker')

    client.publish(TOPIC_CONNECTED, JSON.stringify({}), { qos: 1 })

    client.subscribe(TOPIC_REQUEST, () => {
      debug(`Subscribed to ${TOPIC_REQUEST}`)

      timeout = newTimeout()

      client.on('message', async (topic, buffer) => {
        if (TOPIC_REQUEST === topic) {
          const message = buffer.toString()

          debug(`Mesage from ${TOPIC_REQUEST}`, message)

          const command = JSON.parse(message)

          try {
            const result = await queue.process(command)
            const remoteResult = JSON.stringify({
              value: result,
            })

            debug('Chrome result', result)

            client.publish(TOPIC_RESPONSE, remoteResult)
          } catch (error) {
            const remoteResult = JSON.stringify({
              error: error.toString(),
            })

            debug('Chrome error', error)

            client.publish(TOPIC_RESPONSE, remoteResult)
          }

          clearTimeout(timeout)
          timeout = newTimeout()
        }
      })
    })

    client.subscribe(TOPIC_END, async () => {
      client.on('message', async (topic, buffer) => {
        if (TOPIC_END === topic) {
          const message = buffer.toString()

          debug(`Mesage ${TOPIC_END}`, message)

          clearTimeout(timeout)

          await end()

          callback(null, {
            statusCode: 204,
            channelId,
          })
        }
      })
    })
  })
}
