if (typeof process.env.AWS_REGION === 'undefined') {
  console.error(`
Please set the "AWS_REGION" environment variable to the AWS region to which you wish to deploy.

These are some cheap options:

Ireland:        eu-west-1
USA, Virginia:  us-east-1
USA, Oregon:    us-west-2

For example:

export AWS_REGION=eu-west-1
`)
  process.exit(1)
}

if (typeof process.env.AWS_IOT_HOST === 'undefined') {
  console.error(`
Please set the "AWS_IOT_HOST" environment variable to your ${
    process.env.AWS_REGION
  } region's AWS IoT Custom Endpoint.

You can find it here:
  https://eu-west-1.console.aws.amazon.com/iot/home?region=${
    process.env.AWS_REGION
  }#/settings
Or with the AWS CLI:
  aws iot describe-endpoint --output text --region ${process.env.AWS_REGION}

For Example:

export AWS_REGION=replacethispart.iot.eu-west-1.amazonaws.com

`)
  process.exit(1)
}
