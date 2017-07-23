import { LocalChrome, Queue, ChromelessOptions } from 'chromeless'
import { Realtime } from 'ably'

const debug = require('debug')('serverless')

export interface EventBody {
  options: ChromelessOptions
  pusherChannelName: string
}

export default async (event, context, callback): Promise<void> => {

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
  const ably = new Realtime('eiPuOw.DUAicQ:yq9jJ5164vdtBFIA')
  const channel = ably.channels.get(eventBody.pusherChannelName)

  debug('channel', channel.name)

  channel.publish('connected', '')

  debug('confirmed-connection')

  channel.subscribe('request', async msg => {
    const command = JSON.parse(msg.data)

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
    ably.close()
    await queue.end()

    callback(null, {
      statusCode: 204,
    })
  })
}
