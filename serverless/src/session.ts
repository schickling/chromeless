//import { LocalChrome, Queue, ChromelessOptions } from 'chromeless'
import { connect as mqtt, MqttClient } from 'mqtt'
import * as cuid from 'cuid'
import { createPresignedURL } from './utils'

const debug = require('debug')('session handler')

export default async (event, context, callback): Promise<void> => {
  debug('function invoked with event data: ', event)

  const channelId = cuid()

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
}
