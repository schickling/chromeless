# RemoteChrome Chromeless Serverless service

A Serverless AWS Lambda service for running Chrome remotely with Chromeless.


## Contents
1. [Setup](#Setup)
1. [RemoteChrome](#RemoteChrome)

## Installation

Clone this repository and enter the `serverless` directory, or install directly with Serverless:

```bash
serverless install --url https://github.com/graphcool/chromeless/tree/master/serverless chromeless-remote
```

Next, modify the `custom` section in `serverless.yml`.

- Set `bucket` to a unique bucket name where Chromeless should store screenshots or PDFs
- Set `awsIotHost` to the your AWS IoT Custom Endpoint for your AWS region. You can find this with the AWS CLI with `aws iot describe-endpoint` or by navigating to the AWS IoT Console and going to Settings.

For example:

```yaml
...

custom:
  stage: dev
  debug: "*" # false if you don't want noise in CloudWatch
  bucket: chromeless-data-change-me
  awsIotHost: ${env:AWS_IOT_HOST}

...
```

Once configured, deploying the service can be done with:

```bash
yarn deploy
```

Once completed, some service information will be logged. Make note of the `session` GET endpoint. You'll need it when using RemoteChrome

```log
Service Information
service: chromeless-serverless
stage: dev
region: eu-west-1
api keys:
  None
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

Interacting with an instance of RemoteChrome can be done by using the `remote` option parameter on the Chromeless constructor. You must provide the endpoint provided during deployment either as an argument or set it in the `CHROMELESS_REMOTE_ENDPOINT` environment variable. Note that this endpoint is _different_ from the AWS IoT Custom Endpoint.

```bash
export CHROMELESS_REMOTE_ENDPOINT=https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/session
```

Or

```js
const chromeless = new Chromeless({
  remote: { endpoint: 'https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/session' },
  debug: true,
})
```


### Full Example

```js
const Chromeless = require('chromeless').default

async function run() {
  const chromeless = new Chromeless({
    remote: { endpoint: 'https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev/session' },
    debug: true,
  })

  const screenshot = await chromeless
    .goto('https://www.google.com')
    .type('chromeless', 'input[name="q"]')
    .press(13)
    .wait('#resultStats')
    .screenshot()
    .scrollTo(0, 1000)

  console.log(screenshot) // prints local file path or S3 url


  await chromeless.end()
}

run().catch(console.error.bind(console))
```
