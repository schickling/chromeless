# Chromeless

[![npm](https://img.shields.io/npm/v/chromeless.svg)](https://npmjs.com/package/chromeless)
[![downloads](https://img.shields.io/npm/dm/chromeless.svg)](https://npmjs.com/package/chromeless)
[![circleci](https://circleci.com/gh/graphcool/chromeless.svg?style=shield)](https://circleci.com/gh/graphcool/workflows/chromeless/tree/master)
[![codecov](https://codecov.io/gh/graphcool/chromeless/branch/master/graph/badge.svg)](https://codecov.io/gh/graphcool/chromeless)
[![dependencies](https://david-dm.org/graphcool/chromeless/status.svg)](https://david-dm.org/graphcool/chromeless)
[![node](https://img.shields.io/node/v/chromeless.svg)]()
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

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

You can try out Chromeless and explore the API in the browser-based **[demo playground](https://chromeless.netlify.com/)** ([source](https://github.com/graphcool/chromeless-playground)).

[![](http://i.imgur.com/i1gtCzy.png)](https://chromeless.netlify.com/)

## Contents
1. [How it works](#how-it-works)
1. [Installation](#installation)
1. [Usage](#usage)
1. [API Documentation](#api-documentation)
1. [Configuring Development Environment](#configuring-development-environment)
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

To run Chromeless locally, you need a recent version of Chrome or Chrome Canary installed (version 60 or greater). By default, chromeless will start Chrome automatically and will default to the most recent version found on your system if there's multiple. You can override this behavior by starting Chrome yourself, and passing a flag of `launchChrome: false` in the `Chromeless` constructor.

To launch Chrome yourself, and open the port for chromeless, follow this example:

```sh
alias canary="/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary"
canary --remote-debugging-port=9222
```

Or run Chrome Canary headless-ly:

```sh
canary --remote-debugging-port=9222 --disable-gpu --headless
```

Or run Chrome headless-ly on Windows:

```sh
cd "C:\Program Files (x86)\Google\Chrome\Application"
chrome --remote-debugging-port=9222 --disable-gpu --headless
```

### Proxy Usage

Follow the setup instructions [here](serverless#installation).

Then using Chromeless with the Proxy service is the same as running it locally with the exception of the `remote` option.
Alternatively you can configure the Proxy service's endpoint with environment variables. [Here's how](serverless#using-the-proxy).
```js
const chromeless = new Chromeless({
  remote: {
    endpointUrl: 'https://XXXXXXXXXX.execute-api.eu-west-1.amazonaws.com/dev',
    apiKey: 'your-api-key-here',
  },
})
```

## API Documentation

**Chromeless constructor options**
- [`new Chromeless(options: ChromelessOptions)`](docs/api.md#chromeless-constructor-options)

**Chromeless methods**
- [`end()`](docs/api.md#api-end)

**Chrome methods**
- [`goto(url: string, timeout?: number)`](docs/api.md#api-goto)
- [`setUserAgent(useragent: string)`](docs/api.md#api-setUserAgent)
- [`click(selector: string)`](docs/api.md#api-click)
- [`wait(timeout: number)`](docs/api.md#api-wait-timeout)
- [`wait(selector: string)`](docs/api.md#api-wait-selector)
- [`wait(fn: (...args: any[]) => boolean, ...args: any[])`] - Not implemented yet
- [`clearCache()`](docs/api.md#api-clearcache)
- [`clearStorage(origin: string, storageTypes: string)`](docs/api.md#api-clearstorage)
- [`focus(selector: string)`](docs/api.md#api-focus)
- [`press(keyCode: number, count?: number, modifiers?: any)`](docs/api.md#api-press)
- [`type(input: string, selector?: string)`](docs/api.md#api-type)
- [`back()`](docs/api.md#api-back) - Not implemented yet
- [`forward()`](docs/api.md#api-forward) - Not implemented yet
- [`refresh()`](docs/api.md#api-refresh) - Not implemented yet
- [`mousedown(selector: string)`](docs/api.md#api-mousedown)
- [`mouseup(selector: string)`](docs/api.md#api-mouseup)
- [`scrollTo(x: number, y: number)`](docs/api.md#api-scrollto)
- [`scrollToElement(selector: string)`](docs/api.md#api-scrolltoelement)
- [`setHtml(html: string)`](docs/api.md#api-sethtml)
- [`setExtraHTTPHeaders(headers: Headers)`](docs/api.md#api-setextrahttpheaders)
- [`setViewport(options: DeviceMetrics)`](docs/api.md#api-setviewport)
- [`evaluate<U extends any>(fn: (...args: any[]) => void, ...args: any[])`](docs/api.md#api-evaluate)
- [`inputValue(selector: string)`](docs/api.md#api-inputvalue)
- [`exists(selector: string)`](docs/api.md#api-exists)
- [`screenshot(selector: string, options: ScreenshotOptions)`](docs/api.md#api-screenshot)
- [`pdf(options?: PdfOptions)`](docs/api.md#api-pdf)
- [`html()`](docs/api.md#api-html)
- [`cookies()`](docs/api.md#api-cookies)
- [`cookies(name: string)`](docs/api.md#api-cookies-name)
- [`cookies(query: CookieQuery)`](docs/api.md#api-cookies-query) - Not implemented yet
- [`allCookies()`](docs/api.md#api-all-cookies)
- [`setCookies(name: string, value: string)`](docs/api.md#api-setcookies)
- [`setCookies(cookie: Cookie)`](docs/api.md#api-setcookies-one)
- [`setCookies(cookies: Cookie[])`](docs/api.md#api-setcookies-many)
- [`deleteCookies(name: string)`](docs/api.md#api-deletecookies)
- [`clearCookies()`](docs/api.md#api-clearcookies)
- [`clearInput(selector: string)`](docs/api.md#api-clearInput)
- [`setFileInput(selector: string, files: string | string[])`](docs/api.md#api-set-file-input)

## Configuring Development Environment

**Requirements:**
- NodeJS version 8.2 and greater

1) Clone this repository
2) Run `npm install`
3) To build: `npm run build`

#### Linking this NPM repository

1) Go to this repository locally
2) Run `npm link`
3) Go to the folder housing your chromeless scripts
4) Run `npm link chromeless`

Now your local chromeless scripts will use your local development of chromeless.

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

### Are there commercial options?

Although Chromeless is the easiest way to get started running Chrome on Lambda, you may not have time to build and manage your own visual testing toolkit. Commercial options include:

* [Chromatic](http://chromaticqa.com): Visual snapshot regression testing for [Storybook](https://storybook.js.org/).

## Troubleshooting
### Error: Unable to get presigned websocket URL and connect to it.
In case you get an error like this when running the Chromeless client:
```
{ HTTPError: Response code 403 (Forbidden)
    at stream.catch.then.data (/code/chromeless/node_modules/got/index.js:182:13)
    at process._tickDomainCallback (internal/process/next_tick.js:129:7)
  name: 'HTTPError',
...
Error: Unable to get presigned websocket URL and connect to it.
```
Make sure that you're running at least version `1.19.0` of [`serverless`](https://github.com/serverless/serverless). It is a known [issue](https://github.com/serverless/serverless/issues/2450), that the API Gateway API keys are not setup correctly in older Serverless versions. Best is to run `npm run deploy` within the project as this will use the local installed version of `serverless`.

### Resource ServerlessDeploymentBucket does not exist for stack chromeless-serverless-dev
In case the deployment of the serverless function returns an error like this:
```
  Serverless Error ---------------------------------------

  Resource ServerlessDeploymentBucket does not exist for stack chromeless-serverless-dev
```
Please check, that there is no stack with the name `chromeless-serverless-dev` existing yet, otherwise serverless can't correctly provision the bucket.

### No command gets executed
In order for the commands to be processed, make sure, that you call one of the commands `screenshot`, `evaluate`, `cookiesGetAll` or `end` at the end of your execution chain.

## Contributors

A big thank you to all contributors and supporters of this repository 💚

<a href="https://github.com/joelgriffith/" target="_blank">
  <img src="https://github.com/joelgriffith.png?size=64" width="64" height="64" alt="joelgriffith">
</a>
<a href="https://github.com/adieuadieu/" target="_blank">
  <img src="https://github.com/adieuadieu.png?size=64" width="64" height="64" alt="adieuadieu">
</a>
<a href="https://github.com/schickling/" target="_blank">
  <img src="https://github.com/schickling.png?size=64" width="64" height="64" alt="schickling">
</a>
<a href="https://github.com/timsuchanek/" target="_blank">
  <img src="https://github.com/timsuchanek.png?size=64" width="64" height="64" alt="timsuchanek">
</a>


<a href="https://github.com/Chrisgozd/" target="_blank">
  <img src="https://github.com/Chrisgozd.png?size=64" width="64" height="64" alt="Chrisgozd">
</a>
<a href="https://github.com/criticalbh/" target="_blank">
  <img src="https://github.com/criticalbh.png?size=64" width="64" height="64" alt="criticalbh">
</a>
<a href="https://github.com/d2s/" target="_blank">
  <img src="https://github.com/d2s.png?size=64" width="64" height="64" alt="d2s">
</a>
<a href="https://github.com/emeth-/" target="_blank">
  <img src="https://github.com/emeth-.png?size=64" width="64" height="64" alt="emeth-">
</a>
<a href="https://github.com/githubixx/" target="_blank">
  <img src="https://github.com/githubixx.png?size=64" width="64" height="64" alt="githubixx">
</a>
<a href="https://github.com/hax/" target="_blank">
  <img src="https://github.com/hax.png?size=64" width="64" height="64" alt="hax">
</a>
<a href="https://github.com/Hazealign/" target="_blank">
  <img src="https://github.com/Hazealign.png?size=64" width="64" height="64" alt="Hazealign">
</a>
<a href="https://github.com/joeyvandijk/" target="_blank">
  <img src="https://github.com/joeyvandijk.png?size=64" width="64" height="64" alt="joeyvandijk">
</a>
<a href="https://github.com/liady/" target="_blank">
  <img src="https://github.com/liady.png?size=64" width="64" height="64" alt="liady">
</a>
<a href="https://github.com/matthewmueller/" target="_blank">
  <img src="https://github.com/matthewmueller.png?size=64" width="64" height="64" alt="matthewmueller">
</a>
<a href="https://github.com/seangransee/" target="_blank">
  <img src="https://github.com/seangransee.png?size=64" width="64" height="64" alt="seangransee">
</a>
<a href="https://github.com/sorenbs/" target="_blank">
  <img src="https://github.com/sorenbs.png?size=64" width="64" height="64" alt="sorenbs">
</a>
<a href="https://github.com/toddwprice/" target="_blank">
  <img src="https://github.com/toddwprice.png?size=64" width="64" height="64" alt="toddwprice">
</a>
<a href="https://github.com/vladgolubev/" target="_blank">
  <img src="https://github.com/vladgolubev.png?size=64" width="64" height="64" alt="vladgolubev">
</a>




## Credits

* [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface): Chromeless uses this package as an interface to Chrome
* [serverless-chrome](https://github.com/adieuadieu/serverless-chrome): Compiled Chrome binary that runs on AWS Lambda (Azure and GCP soon, too.)
* [NightmareJS](https://github.com/segmentio/nightmare): We draw a lot of inspiration for the API from this great tool


<a name="help-and-community" />

## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

[![](http://i.imgur.com/5RHR6Ku.png)](https://www.graph.cool/)
