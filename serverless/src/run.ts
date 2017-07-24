import { LocalChrome, Queue, ChromelessOptions } from 'chromeless'
import { connect as mqtt, MqttClient } from 'mqtt'
import { createPresignedURL } from './utils'

const debug = require('debug')('serverless')

export interface EventBody {
  options: ChromelessOptions
  pusherChannelName: string
}

export default async (event, context, callback): Promise<void> => {

  debug('invoke', event)

  let eventBody: EventBody = {options: {}, pusherChannelName: ''}

  try {
    eventBody = JSON.parse(event.body)
  } catch (error) {
    return callback(null, {
      statusCode: 400,
      eventBody: JSON.stringify({
        error: 'Malformed request eventBody. Expected JSON.',
      }),
    })
  }

  const chrome = new LocalChrome({
    ...eventBody.options,
    remote: false,
  })

  const queue = new Queue(chrome)

  const url = createPresignedURL()

  const channel = mqtt(url)

  channel.publish('connected', '')

  debug('confirmed-connection')

  channel.subscribe('request', async msg => {
    const command = JSON.parse("{}")

    debug('received-command', command)

    try {
      const result = await queue.process(command)
      const remoteResult = JSON.stringify({
        value: result,
      })

      debug('chrome-result', result)

      channel.publish('response', remoteResult)
    } catch (error) {
      const remoteResult = JSON.stringify({
        error: error.toString(),
      })

      channel.publish('response', remoteResult)
    }
  })

  channel.subscribe('end', async () => {
    channel.unsubscribe('end')
    channel.end()
    await queue.end()

    callback(null, {
      statusCode: 204,
    })
  })
}
