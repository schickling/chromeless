import debugLogger from 'debug'
import { LocalChrome, Queue } from '..'
import { Realtime } from 'ably'

export interface EventBody {
  options: any // @TODO: lazy.
  pusherChannelName: string
}

const debug = debugLogger('handler')

export async function run(
  event,
  context,
  callback,
  chromeInstance
): Promise<void> {
  debug('started', chromeInstance)

  // @TODO: lazy
  let eventBody: EventBody = { options: {}, pusherChannelName: '' }

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
    chromelessOptions: {
      ...eventBody.options,
      runRemote: false,
    },
  })

  const queue = new Queue(chrome)
  const ably = new Realtime('eiPuOw.DUAicQ:yq9jJ5164vdtBFIA')
  const channel = ably.channels.get(eventBody.pusherChannelName)

  console.log(eventBody.pusherChannelName)

  channel.publish('connected', '')

  console.log('triggered connection')

  channel.subscribe('request', async msg => {
    const command = JSON.parse(msg.data)

    console.log('command', command)

    try {
      const result = await queue.process(command)
      const remoteResult = JSON.stringify({
        value: result,
      })

      console.log(result)

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
