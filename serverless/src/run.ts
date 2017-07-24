import { LocalChrome, Queue, ChromelessOptions } from 'chromeless'
import { connect as mqtt, MqttClient } from 'mqtt'
import { createPresignedURL } from './utils'

const debug = require('debug')('session handler')

export async function run(event, context, callback): Promise<void> {
  debug('function invoked with event data: ', event)

  const chrome = new LocalChrome({
    // @TODO ...eventBody.options,
    remote: false,
    cdp: { closeTab: true },
  })
  const queue = new Queue(chrome)
  const targetId = await chrome.getTargetId()
  const channelId = event.channelId

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
    debug('Connected to AWS IoT Broker')

    client.publish(TOPIC_CONNECTED, JSON.stringify({}), { qos: 1 })

    client.subscribe(TOPIC_REQUEST, () => {
      let timeout = setTimeout(() => {
        callback('Timed out after 30sec. No requests received.')
        process.exit()
      }, 30000) // give up after 30sec

      client.on('message', async (topic, buffer) => {
        if (TOPIC_REQUEST === topic) {
          const message = buffer.toString()
          const command = JSON.parse(message)

          debug('received-command', command)

          try {
            const result = await queue.process(command)
            const remoteResult = JSON.stringify({
              value: result,
            })

            debug('chrome-result', result)

            client.publish(TOPIC_RESPONSE, remoteResult)
          } catch (error) {
            const remoteResult = JSON.stringify({
              error: error.toString(),
            })

            client.publish(TOPIC_RESPONSE, remoteResult)
          }

          clearTimeout(timeout)
          timeout = setTimeout(() => {
            callback('Timed out after 30sec. No further requests received.')
            process.exit()
          }, 30000) // give up after 30sec
        }
      })
    })

    client.subscribe(TOPIC_END, async () => {
      client.on('message', async (topic, buffer) => {
        if (TOPIC_END === topic) {
          const message = buffer.toString()

          client.unsubscribe(TOPIC_END)
          client.end()
          await queue.end()

          chrome.close()

          callback(null, {
            statusCode: 204,
            channelId,
          })
        }
      })
    })
  })
}
