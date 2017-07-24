import * as AWS from 'aws-sdk'

const iotData = new AWS.IotData({ endpoint: process.env.AWS_IOT_HOST })

export default async (event, context, callback): Promise<void> => {
  let params = {
    topic: `chrome/${event}/end`,
    payload: JSON.stringify({ disconnected: event }),
    qos: 1,
  }

  iotData.publish(params, function(err, data) {
    if (err) {
      console.log(`Unable to notify IoT of stories update: ${err}`)
    } else {
      console.log('Successfully notified IoT of stories update')
    }
  })
}
