import 'source-map-support/register'
import { LocalChrome, Queue, ChromelessOptions } from 'chromeless'
import { connect as mqtt, MqttClient } from 'mqtt'
import { createPresignedURL, debug } from './utils'

let isLambdaColdStart = true

if (process.env.DEBUG) {
  process.on('unhandledRejection', error =>
    console.warn('There was an unhandledRejection', error),
  )
  process.on('uncaughtException', error =>
    console.error('There was an uncaughtException', error),
  )
}

export default async (
  { channelId, options },
  context,
  callback,
  chromeInstance,
): Promise<void> => {
  // used to block requests from being processed while we're exiting
  let endingInvocation = false
  let timeout
  let executionCheckInterval

  if (isLambdaColdStart) {
    debug('Coldstart Lambda container')
    isLambdaColdStart = false
  } else {
    debug('Warm Lambda container')
  }

  debug('Invoked with data: ', channelId, options)

  const chrome = new LocalChrome({
    ...options,
    remote: false,
    launchChrome: false,
    cdp: { closeTab: true },
  })

  const queue = new Queue(chrome)

  const TOPIC_CONNECTED = `chrome/${channelId}/connected`
  const TOPIC_REQUEST = `chrome/${channelId}/request`
  const TOPIC_RESPONSE = `chrome/${channelId}/response`
  const TOPIC_END = `chrome/${channelId}/end`

  // @TODO: might make sense to switch to https://github.com/mqttjs/async-mqtt
  const channel = mqtt(createPresignedURL())

  if (process.env.DEBUG) {
    channel.on('error', error => debug('WebSocket error', error))
    channel.on('offline', () => debug('WebSocket offline'))
  }

  /*
    Clean up function whenever we want to end the invocation.
    Importantly we publish a message that we're disconnecting, and then
    we kill the running Chrome instance.
  */
  const end = async (topic_end_data = {}) => {
    debug('Ending invocation..')

    if (!endingInvocation) {
      endingInvocation = true
      clearInterval(executionCheckInterval)
      clearTimeout(timeout)

      try {
        await new Promise(resolve => {
          channel.unsubscribe(TOPIC_END, () => {
            debug(`Unsubscribed from ${TOPIC_END}`)

            channel.publish(
              TOPIC_END,
              JSON.stringify({ channelId, chrome: true, ...topic_end_data }),
              {
                qos: 0,
              },
              async () => {
                await new Promise(resolve => channel.end(false, resolve))

                await queue.end()
                debug('Closed chromeless queue instance')

                await chromeInstance.kill()
                debug('Killed Chrome')

                resolve()
              },
            )
          })
        })
      } catch (error) {
        debug('Something went wrong while trying to end the session', error)
        throw new Error(error)
      }

      debug('Chromeless Proxy session concluded.')
      return callback(null, 'success')
    }

    return Promise.resolve()
  }

  const newTimeout = () =>
    setTimeout(async () => {
      debug('Timing out. No requests received for 30 seconds.')
      await end({ inactivity: true })
    }, 30000)

  /*
    When we're almost out of time, we clean up.
    Importantly this makes sure that Chrome isn't running on the next invocation
    and publishes a message to the client letting it know we're disconnecting.
  */
  executionCheckInterval = setInterval(async () => {
    if (context.getRemainingTimeInMillis() < 5000) {
      debug('Ran out of execution time.')
      await end({ outOfTime: true })
    }
  }, 1000)

  channel.on('connect', () => {
    debug('Connected to AWS IoT broker')

    /*
      Publish that we've connected. This lets the client know that
      it can start sending requests (commands) for us to process.
    */
    channel.publish(TOPIC_CONNECTED, JSON.stringify({}), { qos: 1 })

    /*
      The main bit. Listen for requests from the client, handle them
      and respond with the result.
    */
    channel.subscribe(TOPIC_REQUEST, () => {
      debug(`Subscribed to ${TOPIC_REQUEST}`)

      timeout = newTimeout()

      channel.on('message', async (topic, buffer) => {
        if (TOPIC_REQUEST === topic && !endingInvocation) {
          const message = buffer.toString()

          clearTimeout(timeout)

          debug(`Message from ${TOPIC_REQUEST}`, message)

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
              error: error.toString(), // @TODO: handle this in ChromelessRemote
            })

            debug('Chrome error', error)

            channel.publish(TOPIC_RESPONSE, remoteResult, { qos: 1 })
          }

          timeout = newTimeout()
        }
      })
    })

    /*
      Handle diconnection from the client.
      Either the client purposfully ended the session, or the client
      connection was abruptly ended resulting in a last-will message
      being dispatched by the IoT MQTT broker.
    */
    channel.subscribe(TOPIC_END, () => {
      channel.on('message', async (topic, buffer) => {
        if (TOPIC_END === topic) {
          const message = buffer.toString()
          const data = JSON.parse(message)

          debug(`Message from ${TOPIC_END}`, message)
          debug(
            `Client ${data.disconnected ? 'disconnected' : 'ended session'}.`,
          )

          await end()

          debug('Ended successfully.')
        }
      })
    })
  })
}
