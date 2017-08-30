import * as aws4 from 'aws4'

/*
  This creates a presigned URL for accessing the AWS IoT MQTT Broker.
  Notably, the sessionToken is simply tacked on to the end, and not signed.
  Because AWS. Thank you @shortjared for your help pointing this out.
*/
export function createPresignedURL(
  {
    host = process.env.AWS_IOT_HOST,
    path = '/mqtt',
    region = process.env.AWS_REGION,
    service = 'iotdevicegateway',
    accessKeyId = process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken = process.env.AWS_SESSION_TOKEN,
    // expires = 0, // @TODO: 300, check if this is working http://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
  } = {},
): string {
  const signed = aws4.sign(
    {
      host,
      path,
      service,
      region,
      signQuery: true,
      // headers: {
      //   'X-Amz-Expires': expires,
      // },
    },
    {
      accessKeyId,
      secretAccessKey,
    },
  )

  return `wss://${host}${signed.path}&X-Amz-Security-Token=${encodeURIComponent(
    sessionToken,
  )}`
}

export function debug(...log) {
  if (process.env.DEBUG) {
    console.log(
      ...log.map(
        argument =>
          typeof argument === 'object'
            ? JSON.stringify(argument, null, 2)
            : argument
      )
    )
  }
}
