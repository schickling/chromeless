//import { LocalChrome, Queue, ChromelessOptions } from 'chromeless'
import { connect as mqtt, MqttClient } from 'mqtt'
import * as cuid from 'cuid'
import { createPresignedURL } from './utils'

const debug = require('debug')('session handler')

export async function run(event, context, callback): Promise<void> {
  //context.callbackWaitsForEmptyEventLoop = false

  debug('function invoked with event data: ', event)

  /*const chrome = new LocalChrome({
    // @TODO ...eventBody.options,
    remote: false,
    cdp: { closeTab: true },
  })
  const queue = new Queue(chrome)*/
  const channelId = cuid() //await chrome.getTargetId()

  const TOPIC_CONNECTED = `chrome/${channelId}/connected`
  const TOPIC_REQUEST = `chrome/${channelId}/request`
  const TOPIC_RESPONSE = `chrome/${channelId}/response`
  const TOPIC_END = `chrome/${channelId}/end`


/*
  const lambda = new Lambda()

  await lambda.invoke({
    FunctionName: getFunctionName(remoteOptions),
    Payload,
  }).promise()
*/

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ url: createPresignedURL(), channelId }),
  })



/*
  const client = mqtt(createPresignedURL())

  // @TODO just... remove this.
  if (process.env.DEBUG) {
    client.on('error', error => debug('WebSocket error', error))

    client.on('packetsend', packet => debug('WebSocket packet sent', packet))

    client.on('packetreceive', packet =>
      debug('WebSocket packet received', packet)
    )

    client.on('offline', () => debug('WebSocket offline'))
  }

  client.on('connect', () => {
    debug('Connected to AWS IoT Broker')

    client.publish(TOPIC_CONNECTED, 'hi', { qos: 2 })

    client.subscribe(TOPIC_REQUEST, () => {
      client.on('message', async (topic, buffer) => {
        if (TOPIC_END === topic) {
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
        }
      })
    })
  })
  */
}
