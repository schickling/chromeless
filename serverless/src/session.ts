import { connect as mqtt, MqttClient } from 'mqtt'
import * as cuid from 'cuid'
import { createPresignedURL } from './utils'

const debug = require('debug')('session handler')

export default async (event, context, callback): Promise<void> => {
  debug('function invoked with event data: ', event)

  const url = createPresignedURL()
  const channelId = cuid()

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ url, channelId }),
  })
}
