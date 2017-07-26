# Chromeless [![npm version](https://badge.fury.io/js/chromeless.svg)](https://badge.fury.io/js/chromeless)

Chrome automation made simple. Runs locally or headless on AWS Lambda.

## ▶️ Try it out ([Demo](https://chromeless.netlify.com/))

[![](http://i.imgur.com/i1gtCzy.png)](https://chromeless.netlify.com/)

## Chromeless can be used for...

* Running 1000s of **integration tests in parallel** ⚡️
* Crawling the web & automated screenshots
* Bots that require a real browser
* *Pretty much everything you've used __PhantomJS, NightmareJS or Selenium__ before*

See [examples](/examples) to see what can be done.

## How it works

There are two ways to use Chromeless:

1. Locally
2. Via Proxy

*TODO*

![](http://imgur.com/pvnaOnk.png)

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

### Local chrome usage

```sh
alias canary="/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary"
canary --remote-debugging-port=9222 --disable-gpu http://localhost:9222
canary --remote-debugging-port=9222 --disable-gpu http://localhost:9222 --headless
```

### API

*TODO*

## FAQ

### How is this different from [NightmareJS](https://github.com/segmentio/nightmare), PhantomJS or Selenium?

### Are there any limitations?

If you're running Chromeless on AWS Lambda, the execution cannot take longer than 5 minutes which is the current limit of Lambda. Besides that, every feature that's supported in Chrome is also working with Chromeless.

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


## Credits

* [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface): Chromeless uses this package as an interface to Chrome
* [serverless-chrome](https://github.com/adieuadieu/serverless-chrome): Compiled Chrome binary that runs on AWS Lambda
* [NightmareJS](https://github.com/segmentio/nightmare): We draw a lot of inspiration for the API from this great tool


## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

![](http://i.imgur.com/5RHR6Ku.png)
