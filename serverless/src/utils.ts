import * as aws4 from 'aws4'

export function createPresignedURL(
  {
    host = process.env.AWS_IOT_HOST,
    path = '/mqtt',
    region = process.env.AWS_REGION,
    service = 'iotdevicegateway',
    accessKeyId = process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken = process.env.AWS_SESSION_TOKEN,
  } = {}
): string {
  const signed = aws4.sign(
    {
      host,
      path,
      service,
      region,
      signQuery: true,
    },
    {
      accessKeyId,
      secretAccessKey,
    }
  )

  return `wss://${host}${signed.path}&X-Amz-Security-Token=${encodeURIComponent(
    sessionToken
  )}`
}
