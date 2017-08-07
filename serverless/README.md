# Chromeless Proxy service

A [Serverless](https://serverless.com/) AWS Lambda service for running and interacting with Chrome remotely with Chromeless.


## Contents
1. [Setup](#setup)
1. [Using the Proxy](#using-the-proxy)


## Setup

Clone this repository and enter the `serverless` directory:

```bash
git clone https://github.com/graphcool/chromeless.git
cd chromeless/serverless
npm install
```

### Configure

Next, modify the `custom` section in `serverless.yml`.

You must set `awsIotHost` to the your AWS IoT Custom Endpoint for your AWS region. You can find this with the AWS CLI with `aws iot describe-endpoint --output text` or by navigating to the AWS IoT Console and going to Settings.

For example:

```yaml
...

custom:
  stage: dev
  debug: "*" # false if you don't want noise in CloudWatch
  awsIotHost: ${env:AWS_IOT_HOST}

...
```

You may also need to change the region in the `provider` section in `serverless.yml`:


```yaml
...

provider:
  name: aws
  runtime: nodejs6.10
  stage: ${self:custom.stage}
  region: YOUR_REGION_HERE

...
```

**Note:** The AWS Lambda function, API Gateway and IoT must all be in the _same_ region.

**Note:** Deploying from Windows is currently not supported. See [#70](https://github.com/graphcool/chromeless/issues/70#issuecomment-318634457)


### Credentials

Before you can deploy, you must configure your AWS credentials either by defining `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environmental variables, or using an AWS profile. You can read more about this on the [Serverless Credentials Guide](https://serverless.com/framework/docs/providers/aws/guide/credentials/).

In short, either:

```bash
export AWS_PROFILE=<your-profile-name>
```

or

```bash
export AWS_ACCESS_KEY_ID=<your-key-here>
export AWS_SECRET_ACCESS_KEY=<your-secret-key-here>
```

### Deploy

Once configured, deploying the service can be done with:

```bash
npm run deploy
```

Once completed, some service information will be logged. Make note of the `session` GET endpoint and the value of the `dev-chromeless-session-key` API key. You'll need them when using Chromeless through the Proxy.

```log
Service Information
service: chromeless-serverless
stage: dev
region: eu-west-1
api keys:
  dev-chromeless-session-key: X-your-api-key-here-X
endpoints:
  GET - https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/version
  OPTIONS - https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/
  GET - https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/
functions:
  run: chromeless-serverless-dev-run
  version: chromeless-serverless-dev-version
  session: chromeless-serverless-dev-session
  disconnect: chromeless-serverless-dev-disconnect
```


## Using the Proxy

Connect to the proxy service with the `remote` option parameter on the Chromeless constructor. You must provide the endpoint URL provided during deployment either as an argument or set it in the `CHROMELESS_ENDPOINT_URL` environment variable. Note that this endpoint is _different_ from the AWS IoT Custom Endpoint. The Proxy's endpoint URL you want to use will look something like `https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/`


### Option 1: Environment Variables

```bash
export CHROMELESS_ENDPOINT_URL=https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev
export CHROMELESS_ENDPOINT_API_KEY=your-api-key-here
```
and
```js
const chromeless = new Chromeless({
  remote: true,
})
```

### Option 2: Constructor options

```js
const chromeless = new Chromeless({
  remote: {
    endpointUrl: 'https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev'
    apiKey: 'your-api-key-here'
  },
})
```


### Full Example

```js
const Chromeless = require('chromeless').default

async function run() {
  const chromeless = new Chromeless({
    remote: {
      endpointUrl: 'https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev',
      apiKey: 'your-api-key-here'
    },
  })

  const screenshot = await chromeless
    .goto('https://www.google.com')
    .type('chromeless', 'input[name="q"]')
    .press(13)
    .wait('#resultStats')
    .screenshot()

  console.log(screenshot) // prints local file path or S3 url

  await chromeless.end()
}

run().catch(console.error.bind(console))
```
