# chromeless [![npm version](https://badge.fury.io/js/chromeless.svg)](https://badge.fury.io/js/chromeless)

Chrome automation made simple. Runs locally or headless on AWS Lambda.

## ▶️ Try it out ([Demo](https://chromeless.netlify.com/))

[![](http://i.imgur.com/i1gtCzy.png)](https://chromeless.netlify.com/)

## How it works

*TODO*

## Installation
```sh
npm install chromeless
```

### Remote Setup

The project contains a [Serverless](https://serverless.com/) service for running and driving Chrome remotely on AWS Lambda.

1. Deploy The RemoteChrome service to AWS Lambda. More details [here](https://github.com/graphcool/chromeless/tree/master/serverless#setup)
2. Follow the setup instructions [here](https://github.com/graphcool/chromeless/tree/master/serverless#remotechrome).

```js
const chromeless = new Chromeless({
  remote: {
    endpointUrl: 'https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev'
    apiKey: 'your-api-key-here'
  },
})
```

## Usage
```js
import Chromeless from 'chromeless'

async function run() {
  const chromeless = new Chromeless()

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

### API

*TODO*

## Architecture

### Local execution

![](http://imgur.com/1eM8Bda.png)

### Remote execution

![](http://imgur.com/nYGKGpp.png)

## FAQ

### How is this different from [NightmareJS](https://github.com/segmentio/nightmare), Selenium or similar?

## Contributors

A big thank you to all contributors and supporters of this repository 💚

<a href="https://github.com/adieuadieu/" target="_blank">
  <img src="https://github.com/adieuadieu.png?size=64" width="64" height="64" alt="adieuadieu">
</a>
<a href="https://github.com/schickling/" target="_blank">
  <img src="https://github.com/schickling.png?size=64" width="64" height="64" alt="schickling">
</a>
<a href="https://github.com/timsuchanek/" target="_blank">
  <img src="https://github.com/timsuchanek.png?size=64" width="64" height="64" alt="timsuchanek">
</a>
<a href="https://github.com/matthewmueller/" target="_blank">
  <img src="https://github.com/matthewmueller.png?size=64" width="64" height="64" alt="matthewmueller">
</a>


## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

![](http://i.imgur.com/5RHR6Ku.png)
