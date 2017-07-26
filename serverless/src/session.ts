import { connect as mqtt, MqttClient } from 'mqtt'
import * as cuid from 'cuid'
import { createPresignedURL, debug } from './utils'

export default async (event, context, callback): Promise<void> => {
  const url = createPresignedURL()
  const channelId = cuid()

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ url, channelId }),
  })
}
