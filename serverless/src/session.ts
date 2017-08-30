import { connect as mqtt, MqttClient } from 'mqtt'
import * as cuid from 'cuid'
import { createPresignedURL, debug } from './utils'

export default async (event, context, callback): Promise<void> => {
  const url = createPresignedURL()
  const channelId = cuid()

  // Warmup check
  console.log(JSON.stringify(event))
  if (event && event.warmup) {
    console.log('Invoking Lambda for Warmup')
    return callback(null, 'Lambda is warm')
  }

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ url, channelId }),
  })
}
