import { LocalChrome, Queue, ChromelessOptions } from 'chromeless'
import { connect as mqtt, MqttClient } from 'mqtt'
import { createPresignedURL, debug } from './utils'

export default async (
  { channelId, options },
  context,
  callback,
  chromeInstance
): Promise<void> => {
  debug('Invoked with data: ', channelId, options)

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

  const channel = mqtt(createPresignedURL())

  if (process.env.DEBUG) {
    channel.on('error', error => debug('WebSocket error', error))
    channel.on('offline', () => debug('WebSocket offline'))
  }

  const end = async () => {
    channel.unsubscribe(TOPIC_END)
    channel.publish(TOPIC_END, JSON.stringify({ channelId, chrome: true }), { qos: 1 })
    channel.end()

    await chrome.close()
    await chromeInstance.kill()
  }

  const newTimeout = () =>
    setTimeout(async () => {
      await end()

      callback('Timed out after 30sec. No requests received.')

      // process.exit()
    }, 30000)

  channel.on('connect', () => {
    let timeout

    debug('Connected to AWS IoT broker')

    channel.publish(TOPIC_CONNECTED, JSON.stringify({}), { qos: 1 })

    channel.subscribe(TOPIC_REQUEST, () => {
      debug(`Subscribed to ${TOPIC_REQUEST}`)

      timeout = newTimeout()

      channel.on('message', async (topic, buffer) => {
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

            channel.publish(TOPIC_RESPONSE, remoteResult, { qos: 1 })
          } catch (error) {
            const remoteResult = JSON.stringify({
              error: error.toString(),
            })

            debug('Chrome error', error)

            channel.publish(TOPIC_RESPONSE, remoteResult, { qos: 1 })
          }

          clearTimeout(timeout)
          timeout = newTimeout()
        }
      })
    })

    channel.subscribe(TOPIC_END, async () => {
      channel.on('message', async (topic, buffer) => {
        if (TOPIC_END === topic) {
          const message = buffer.toString()
          const data = JSON.parse(message)

          clearTimeout(timeout)

          debug(`Mesage from ${TOPIC_END}`, message)
          debug(`Client ${data.end ? 'ended session' : 'disconnected'}.`)

          await end()

          callback(null, { success: true })

          // process.exit()
        }
      })
    })
  })
}
