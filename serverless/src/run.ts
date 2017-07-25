import { LocalChrome, Queue, ChromelessOptions } from 'chromeless'
import { connect as mqtt, MqttClient } from 'mqtt'
import { createPresignedURL } from './utils'

const debug = require('debug')('run handler')

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

  client.on('connect', () => {
    debug('Connected to AWS IoT broker')

    client.publish(TOPIC_CONNECTED, JSON.stringify({}), { qos: 1 })

    client.subscribe(TOPIC_REQUEST, () => {
      debug(`Subscribed to ${TOPIC_REQUEST}`)

      let timeout = setTimeout(async () => {
        callback('Timed out after 30sec. No requests received.')
        await chromeInstance.kill()
        process.exit()
      }, 30000) // give up after 30sec

      client.on('message', async (topic, buffer) => {
        if (TOPIC_REQUEST === topic) {
          const message = buffer.toString()

          debug(`Mesage ${TOPIC_REQUEST}`, message)

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

          timeout = setTimeout(async () => {
            callback('Timed out after 30sec. No further requests received.')
            await chromeInstance.kill()
            process.exit()
          }, 30000) // give up after 30sec
        }
      })
    })

    client.subscribe(TOPIC_END, async () => {
      client.on('message', async (topic, buffer) => {
        if (TOPIC_END === topic) {
          const message = buffer.toString()

          debug(`Mesage ${TOPIC_END}`, message)

          client.unsubscribe(TOPIC_END)
          client.end()
          await queue.end()

          chrome.close()
          await chromeInstance.kill()

          callback(null, {
            statusCode: 204,
            channelId,
          })
        }
      })
    })
  })
}
