# RemoteChrome Chromeless Serverless service

A Serverless AWS Lambda service for running Chrome remotely with Chromeless.


## Contents
1. [Setup](#setup)
1. [RemoteChrome](#remotechrome)

## Installation

Clone this repository and enter the `serverless` directory:

```bash
git clone https://github.com/graphcool/chromeless.git
cd chromeless/serverless
```

Next, modify the `custom` section in `serverless.yml`.

You must set `awsIotHost` to the your AWS IoT Custom Endpoint for your AWS region. You can find this with the AWS CLI with `aws iot describe-endpoint` or by navigating to the AWS IoT Console and going to Settings.

For example:

```yaml
...

custom:
  stage: dev
  debug: "*" # false if you don't want noise in CloudWatch
  awsIotHost: ${env:AWS_IOT_HOST}

...
```

Once configured, deploying the service can be done with:

```bash
npm deploy
```

Once completed, some service information will be logged. Make note of the `session` GET endpoint and the value of the `dev-chromeless-session-key` API key. You'll need them when using RemoteChrome.

```log
Service Information
service: chromeless-serverless
stage: dev
region: eu-west-1
api keys:
  dev-chromeless-session-key: X-your-api-key-here-X
endpoints:
  GET - https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/version
  OPTIONS - https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/session
  GET - https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/session
functions:
  run: chromeless-serverless-dev-run
  version: chromeless-serverless-dev-version
  session: chromeless-serverless-dev-session
  disconnect: chromeless-serverless-dev-disconnect
```


## RemoteChrome

Interacting with an instance of RemoteChrome can be done by using the `remote` option parameter on the Chromeless constructor. You must provide the endpoint provided during deployment either as an argument or set it in the `CHROMELESS_ENDPOINT_URL` environment variable. Note that this endpoint is _different_ from the AWS IoT Custom Endpoint.

```bash
export CHROMELESS_ENDPOINT_URL=https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/session
export CHROMELESS_ENDPOINT_API_KEY=your-api-key-here
```

Or

```js
const chromeless = new Chromeless({
  remote: {
    endpointUrl: 'https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/session'
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
      endpointUrl: 'https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/session'
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
