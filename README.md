# Chromeless [![npm version](https://badge.fury.io/js/chromeless.svg)](https://badge.fury.io/js/chromeless)

Chrome automation made simple. Runs locally or headless on AWS Lambda. (**[See Demo](https://chromeless.netlify.com/)**)

## Chromeless can be used to...

* Run 1000s of **browser integration tests in parallel** ⚡️
* Crawl the web & automate screenshots
* Write bots that require a real browser
* *Do pretty much everything you've used __PhantomJS, NightmareJS or Selenium__ for before*

### Examples

* [JSON of Google Results](examples/extract-google-results.js): Google for `chromeless` and get a list of JSON results
* [Screenshot of Google Results](examples/google-screenshot.js): Google for `chromeless` and take a screenshot of the results
* [prep](https://github.com/graphcool/prep): Compile-time prerendering for SPA/PWA (like React, Vue...) instead of server-side rendering (SSR)
* *See the full [examples list](/examples) for more*

## ▶️ Try it out

You can try out Chromeless and explore the API in the browser-based **[demo playground](https://chromeless.netlify.com/)**.

[![](http://i.imgur.com/i1gtCzy.png)](https://chromeless.netlify.com/)

## Contents
1. [How it works](#how-it-works)
1. [Installation](#installation)
1. [Usage](#usage)
1. [API Documentation](#api-documentation)
1. [FAQ](#faq)
1. [Contributors](#contributors)
1. [Credits](#credits)
1. [Help & Community](#help-and-community)

## How it works

With Chromeless you can control Chrome (open website, click elements, fill out forms...) using an [elegant API](docs/api.md). This is useful for integration tests or any other scenario where you'd need to script a real browser.

### There are 2 ways to use Chromeless

1. Running Chrome on your local computer
2. Running Chrome on AWS Lambda and controlling it remotely

![](http://imgur.com/2bgTyAi.png)

### 1. Local Setup

For local development purposes where a fast feedback loop is necessary, the easiest way to use Chromeless is by controlling your local Chrome browser. Just follow the [usage guide](#usage) to get started.

### 2. Remote Proxy Setup

You can also run Chrome in [headless-mode](https://developers.google.com/web/updates/2017/04/headless-chrome) on AWS Lambda. This way you can speed up your tests by running them in parallel. (In [Graphcool](https://www.graph.cool/)'s case this decreased test durations from ~20min to a few seconds.)

Chromeless comes out of the box with a remote proxy built-in - the usage stays completely the same. This way you can write and run your tests locally and have them be executed remotely on AWS Lambda. The proxy connects to Lambda through a Websocket connection to forward commands and return the evaluation results.

## Installation
```sh
npm install chromeless
```

### Proxy Setup

The project contains a [Serverless](https://serverless.com/) service for running and driving Chrome remotely on AWS Lambda.

1. Deploy The Proxy service to AWS Lambda. More details [here](serverless#setup)
2. Follow the usage instructions [here](serverless#using-the-proxy).


## Usage

Using Chromeless is similar to other browser automation tools. For example:

```js
const { Chromeless } = require('chromeless')

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

### Local Chrome Usage

To run Chromeless locally, you need a recent version of Chrome or Chrome Canary installed and running.

For example, on MacOS:

```sh
alias canary="/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary"
canary --remote-debugging-port=9222
```

Or run Chrome Canary headless-ly:

```sh
canary --remote-debugging-port=9222 --disable-gpu --headless
```

### Proxy Usage

Follow the setup instructions [here](serverless#installation).

Then using Chromeless with the Proxy service is the same as running it locally with the exception of the `remote` option.
Alternatively you can configure the Proxy service's endpoint with environment variables. [Here's how](serverless#using-the-proxy).
```js
const chromeless = new Chromeless({
  remote: {
    endpointUrl: 'https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev'
    apiKey: 'your-api-key-here'
  },
})
```

## API Documentation

**Chromeless methods**
- [`end()`](docs/api.md#api-end)

**Chrome methods**
- [`goto(url: string)`](docs/api.md#api-goto)
- [`click(selector: string)`](docs/api.md#api-click)
- [`wait(timeout: number)`](docs/api.md#api-wait-timeout)
- [`wait(selector: string)`](docs/api.md#api-wait-selector)
- [`wait(fn: (...args: any[]) => boolean, ...args: any[])`](docs/api.md#api-wait-fn)
- [`focus(selector: string)`](docs/api.md#api-focus)
- [`press(keyCode: number, count?: number, modifiers?: any)`](docs/api.md#api-press)
- [`type(input: string, selector?: string)`](docs/api.md#api-type)
- [`back()`](docs/api.md#api-back) - Not implemented yet
- [`forward()`](docs/api.md#api-forward) - Not implemented yet
- [`refresh()`](docs/api.md#api-refresh) - Not implemented yet
- [`mousedown()`](docs/api.md#api-mousedown) - Not implemented yet
- [`mouseup()`](docs/api.md#api-mouseup) - Not implemented yet
- [`scrollTo(x: number, y: number)`](docs/api.md#api-scrollto)
- [`viewport(width: number, height: number)`](docs/api.md#api-viewport)
- [`evaluate<U extends any>(fn: (...args: any[]) => void, ...args: any[])`](docs/api.md#api-evaluate)
- [`inputValue(selector: string)`](docs/api.md#api-inputvalue)
- [`exists(selector: string)`](docs/api.md#api-exists)
- [`screenshot()`](docs/api.md#api-screenshot)
- [`pdf()`](docs/api.md#api-pdf) - Not implemented yet
- [`cookiesGet()`](docs/api.md#api-cookiesget)
- [`cookiesGet(name: string)`](docs/api.md#api-cookiesget-name)
- [`cookiesGet(query: CookieQuery)`](docs/api.md#api-cookiesget-query) - Not implemented yet
- [`cookiesGetAll()`](docs/api.md#api-cookiesgetall)
- [`cookiesSet(name: string, value: string)`](docs/api.md#api-cookiesset)
- [`cookiesSet(cookie: Cookie)`](docs/api.md#api-cookiesset-one)
- [`cookiesSet(cookies: Cookie[])`](docs/api.md#api-cookiesset-many)
- [`cookiesClear(name: string)`](docs/api.md#api-cookiesclear)
- [`cookiesClearAll()`](docs/api.md#api-cookiesclearall)

## FAQ

### How is this different from [NightmareJS](https://github.com/segmentio/nightmare), PhantomJS or Selenium?

The `Chromeless` API is very similar to NightmareJS as their API is pretty awesome. The big difference is that `Chromeless` is based on Chrome in [headless-mode](https://developers.google.com/web/updates/2017/04/headless-chrome), and runs in a serverless function in AWS Lambda. The advantage of this is that you can run hundreds of browsers in parallel, without having to think about parallelisation. Running integration Tests for example is much faster.

### I'm new to AWS Lambda, is this still for me?

You still can use this locally without Lambda, so yes. Besides that, here is a [simple guide](https://github.com/graphcool/chromeless/tree/master/serverless) on how to set the lambda function up for `Chromeless`.

### How much does it cost to run Chromeless in production?

> The compute price is $0.00001667 per GB-s and the free tier provides 400,000 GB-s. The request price is $0.20 per 1 million requests and the free tier provides 1M requests per month.

This means you can easily execute > 100.000 tests for free in the free tier.

### Are there any limitations?

If you're running Chromeless on AWS Lambda, the execution cannot take longer than 5 minutes which is the current limit of Lambda. Besides that, every feature that's supported in Chrome is also working with Chromeless. The maximal number of concurrent function executions is 1000. [AWS API Limits](http://docs.aws.amazon.com/lambda/latest/dg/limits.html)

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
* [serverless-chrome](https://github.com/adieuadieu/serverless-chrome): Compiled Chrome binary that runs on AWS Lambda (Azure and GCP soon, too.)
* [NightmareJS](https://github.com/segmentio/nightmare): We draw a lot of inspiration for the API from this great tool


<a name="help-and-community" />

## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

[![](http://i.imgur.com/5RHR6Ku.png)](https://www.graph.cool/)
