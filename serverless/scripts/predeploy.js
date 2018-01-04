if (typeof process.env.AWS_IOT_HOST === 'undefined') {
  console.error(`
Please set the "AWS_IOT_HOST" environment variable to your region's AWS IoT Custom Endpoint.

You can find it here:
  https://eu-west-1.console.aws.amazon.com/iot/home#/settings
Or with the AWS CLI:
  aws iot describe-endpoint --output text
`)
  process.exit(1)
}
