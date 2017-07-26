import * as AWS from 'aws-sdk'
import { debug } from './utils'

const iotData = new AWS.IotData({ endpoint: process.env.AWS_IOT_HOST })

export default async ({ channelId }, context, callback): Promise<void> => {
  debug('Disconnect on', channelId)

  let params = {
    topic: `chrome/${channelId}/end`,
    payload: JSON.stringify({ channelId, client: true, disconnected: true }),
    qos: 1,
  }

  iotData.publish(params, callback)
}
