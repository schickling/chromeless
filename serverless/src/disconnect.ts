import * as AWS from 'aws-sdk'

const iotData = new AWS.IotData({ endpoint: process.env.AWS_IOT_HOST })

export default async (event, context, callback): Promise<void> => {
  let params = {
    topic: `chrome/${event}/end`,
    payload: JSON.stringify({ disconnected: event }),
    qos: 1,
  }

  iotData.publish(params, callback)
}
