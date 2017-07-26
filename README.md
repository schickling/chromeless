# Chromeless [![npm version](https://badge.fury.io/js/chromeless.svg)](https://badge.fury.io/js/chromeless)

Chrome automation made simple. Runs locally or headless on AWS Lambda. (**[See Demo](https://chromeless.netlify.com/)**)

## Chromeless can be used to...

* Run 1000s of **browser integration tests in parallel** ⚡️
* Crawl the web & automated screenshots
* Write bots that require a real browser
* *Do pretty much everything you've used __PhantomJS, NightmareJS or Selenium__ before*

### Examples

* [prep](https://github.com/graphcool/prep): Compile-time prerendering for SPA/PWA (like React, Vue...) instead of server-side rendering (SSR)
* See the full [examples list](/examples) for more

## ▶️ Try it out

You can try out Chromeless and explore the API in the browser-based **[demo playground](https://chromeless.netlify.com/)**

[![](http://i.imgur.com/i1gtCzy.png)](https://chromeless.netlify.com/)

## How it works

With Chromeless you can control Chrome (open website, click elements, fill out forms...) using an [elegant API](#api). This is useful for integration tests or any other scenario where you'd need to script a real browser.

### There are 2 ways to use Chromeless

1. Running Chrome on your local computer
2. Running Chrome on AWS Lambda and control it remotely

![](http://imgur.com/2bgTyAi.png)

### 1. Local Setup

For local development purposes where a fast feedback loop is necessary, the easiest way to use Chromeless is by controlling your local Chrome browser. Just follow the [usage guide](#usage) to get started.

### 2. Remote Proxy Setup

You can also run Chrome in [headless-mode](https://developers.google.com/web/updates/2017/04/headless-chrome) on AWS Lambda. This way you can speed up your tests by running them in parallel. (In [Graphcool](https://www.graph.cool/)'s case this decreased test durations from ~20min to a few seconds.)

Chromeless comes out of the box with a remote proxy built-in - the usage stays completely the same. This way you can write and run your tests locally by they will actually be executed remotely on AWS Lambda. The proxy connects to Lambda through a Websocket connection to forward commands and return the evaluation results.

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
const Chromeless = require('chromeless')

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

**Chromeless methods**
- [`end()`](#api-end)

**Chrome methods**
- [`goto(url: string)`](#api-goto)
- [`click(selector: string)`](#api-click)
- [`wait(timeout: number)`](#api-wait-timeout)
- [`wait(selector: string)`](#api-wait-selector)
- [`wait(fn: (...args: any[]) => boolean, ...args: any[])`](#api-wait-fn)
- [`focus(selector: string)`](#api-focus)
- [`press(keyCode: number, count?: number, modifiers?: any)`](#api-press)
- [`type(input: string, selector?: string)`](#api-type)
- [`back()`](#api-back) - Not implemented yet
- [`forward()`](#api-forward) - Not implemented yet
- [`refresh()`](#api-refresh) - Not implemented yet
- [`mousedown()`](#api-mousedown) - Not implemented yet
- [`mouseup()`](#api-mouseup) - Not implemented yet
- [`scrollTo(x: number, y: number)`](#api-scrollto)
- [`viewport(width: number, height: number)`](#api-viewport)
- [`evaluate<U extends any>(fn: (...args: any[]) => void, ...args: any[])`](#api-evaluate)
- [`inputValue(selector: string)`](#api-inputvalue)
- [`exists(selector: string)`](#api-exists)
- [`screenshot()`](#api-screenshot)
- [`pdf()`](#api-pdf) - Not implemented yet
- [`cookiesGet()`](#api-cookiesget)
- [`cookiesGet(name: string)`](#api-cookiesget-name)
- [`cookiesGet(query: CookieQuery)`](#api-cookiesget-query) - Not implemented yet
- [`cookiesGetAll()`](#api-cookiesgetall)
- [`cookiesSet(name: string, value: string)`](#api-cookiesset)
- [`cookiesSet(cookie: Cookie)`](#api-cookiesset-one)
- [`cookiesSet(cookies: Cookie[])`](#api-cookiesset-many)
- [`cookiesClear(name: string)`](#api-cookiesclear)
- [`cookiesClearAll()`](#api-cookiesclearall)


---------------------------------------

<a name="api-end" />

### end(): Promise<void>

End the Chromeless session. Locally this will disconnect from Chrome. Over the Proxy, this will end the session, terminating the Lambda function.

```js
await chromeless.end()
```

---------------------------------------

<a name="api-goto" />

### goto(url: string): Chromeless<T>

Navigate to a URL.

__Arguments__
- `url` - URL to navigate to

__Example__

```js
await chromeless.goto('https://google.com/')
```

---------------------------------------

<a name="api-click" />

### click(selector: string): Chromeless<T>

Click on something in the DOM.

__Arguments__
- `selector` - DOM selector for element to click

__Example__

```js
await chromeless.click('#button')
```

---------------------------------------

<a name="api-wait-timeout" />

### wait(timeout: number): Chromeless<T>

Wait for some duration. Useful for waiting for things download.

__Arguments__
- `timeout` - How long to wait, in ms

__Example__

```js
await chromeless.wait(1000)
```

---------------------------------------

<a name="api-wait-selector" />

### wait(selector: string): Chromeless<T>

Wait until something appears. Useful for waiting for things to render.

__Arguments__
- `selector` - DOM selector to wait for

__Example__

```js
await chromeless.wait('div#loaded')
```

---------------------------------------

<a name="api-wait-fn" />

### wait(fn: (...args: any[]) => boolean, ...args: any[]): Chromeless<T>

Wait until a function returns.

__Arguments__
- `fn` - Function to wait for
- `[arguments]` - Arguments to pass to the function

__Example__

```js
await chromeless.wait(() => { return console.log('@TODO: put a better example here') })
```

---------------------------------------

<a name="api-focus" />

### focus(selector: string): Chromeless<T>

Provide focus on a DOM element.

__Arguments__
- `selector` - DOM selector to focus

__Example__

```js
await chromeless.focus('input#searchField')
```

---------------------------------------

<a name="api-press" />

### press(keyCode: number, count?: number, modifiers?: any): Chromeless<T>

Send a key press. Enter, for example.

__Arguments__
- `keyCode` - Key code to send
- `count?` - How many times to send the key press
- `modifiers` - Modifiers to send along with the press (e.g. control, command, or alt)

__Example__

```js
await chromeless.press(13)
```

---------------------------------------

<a name="api-type" />

### type(input: string, selector?: string): Chromeless<T>

Type something (into a field, for example).

__Arguments__
- `input` - String to type
- `selector` - DOM element to type into

__Example__

```js
const result = await chromeless
  .goto('https://www.google.com')
  .type('chromeless', 'input[name="q"]')
```

---------------------------------------

<a name="api-back" />

### back() - Not implemented yet

Not implemented yet

---------------------------------------

<a name="api-forward" />

### forward() - Not implemented yet

Not implemented yet

---------------------------------------

<a name="api-refresh" />

### refresh() - Not implemented yet

Not implemented yet

---------------------------------------

<a name="api-mousedown" />

### mousedown() - Not implemented yet

Not implemented yet

---------------------------------------

<a name="api-mouseup" />

### mouseup() - Not implemented yet

Not implemented yet

---------------------------------------

<a name="api-scrollto" />

### scrollTo(x: number, y: number): Chromeless<T>

Scroll to somewhere in the document.

__Arguments__
- `x` - Offset from top of the document
- `y` - Offset from the left of the document

__Example__

```js
await chromeless.scrollTo(500, 0)
```

---------------------------------------

<a name="api-viewport" />

### viewport(width: number, height: number)

Resize the viewport. Useful if you want to capture more or less of the document in a screenshot.

__Arguments__
- `width` - Viewport width
- `height` - Viewport height

__Example__

```js
await chromeless.viewport(1024, 800)
```

---------------------------------------

<a name="api-evaluate" />

### evaluate<U extends any>(fn: (...args: any[]) => void, ...args: any[]): Chromeless<U>

Evaluate Javascript code within Chrome in the context of the DOM.

__Arguments__
- `fn` - Function to evaluate within Chrome
- `[arguments]` - Arguments to pass to the function

__Example__

```js
await chromeless.evaluate(() => {
    // this will be executed in Chrome
    const links = [].map.call(
      document.querySelectorAll('.g h3 a'),
      a => ({title: a.innerText, href: a.href})
    )
    return JSON.stringify(links)
  })
```

---------------------------------------

<a name="api-inputvalue" />

### inputValue(selector: string): Chromeless<string>

Get the value of an input field.

__Arguments__
- `selector` - DOM input element

__Example__

```js
await chromeless.inputValue('input#searchField')
```

---------------------------------------

<a name="api-exists" />

### exists(selector: string): Chromeless<boolean>

Test if a DOM element exists in the document.

__Arguments__
- `selector` - DOM element to check for

__Example__

```js
await chromeless.exists('div#ready')
```

---------------------------------------

<a name="api-screenshot" />

### screenshot(): Chromeless<string>

Take a screenshot of the document as framed by the viewport.
When running Chromeless locally this returns the local file path to the screenshot image.
When run over the Chromeless Proxy service, a URL to the screenshot on S3 is returned.

__Example__

```js
const screenshot = await chromeless
  .goto('https://google.com/')
  .screenshot()

console.log(screenshot) // prints local file path or S3 URL
```

---------------------------------------

<a name="api-pdf" />

### pdf() - Not implemented yet

Not implemented yet

---------------------------------------

<a name="api-cookiesget" />

### cookiesGet(): Chromeless<Cookie[] | null>

Returns all browser cookies for the current URL.

__Example__

```js
await chromeless.cookiesGet()
```

---------------------------------------

<a name="api-cookiesget-name" />

### cookiesGet(name: string): Chromeless<Cookie | null>

Returns a specific browser cookie by name for the current URL.

__Arguments__
- `name` - Name of the cookie to get

__Example__

```js
const cookie = await chromeless.cookiesGet('creepyTrackingCookie')
```

---------------------------------------

<a name="api-cookiesget-query" />

### cookiesGet(query: CookieQuery) - Not implemented yet

Not implemented yet

---------------------------------------

<a name="api-cookiesgetall" />

### cookiesGetAll(): Chromeless<Cookie[]>

Returns all browser cookies. Nam nom nom.

__Example__

```js
await chromeless.cookiesGetAll()
```

---------------------------------------

<a name="api-cookiesset" />

### cookiesSet(name: string, value: string): Chromeless<T>

Sets a cookie with the given name and value.

__Arguments__
- `name` - Name of the cookie
- `value` - Value of the cookie

__Example__

```js
await chromeless.cookiesSet('visited', '1')
```

---------------------------------------

<a name="api-cookiesset-one" />

### cookiesSet(cookie: Cookie): Chromeless<T>

Sets a cookie with the given cookie data; may overwrite equivalent cookies if they exist.

__Arguments__
- `cookie` - The cookie data to set

__Example__

```js
await chromeless.cookiesSet({
  url: 'http://google.com/',
  domain: 'google.com',
  name: 'userData',
  value: '{}',
  path: '/',
  expires: 0,
  size: 0,
  httpOnly: false,
  secure: true,
  session: true,
})
```

---------------------------------------

<a name="api-cookiesset-many" />

### cookiesSet(cookies: Cookie[]): Chromeless<T>

Sets many cookies with the given cookie data; may overwrite equivalent cookies if they exist.

__Arguments__
- `url` - URL to navigate to

__Example__

```js
await chromeless.cookiesSet([
  {
    url: 'http://google.com/',
    domain: 'google.com',
    name: 'userData',
    value: '{}',
    path: '/',
    expires: 0,
    size: 0,
    httpOnly: false,
    secure: true,
    session: true,
  }, {
    url: 'http://bing.com/',
    domain: 'bing.com',
    name: 'userData',
    value: '{}',
    path: '/',
    expires: 0,
    size: 0,
    httpOnly: false,
    secure: true,
    session: true,
  }
])
```

---------------------------------------

<a name="api-cookiesclear" />

### cookiesClear(name: string) - Not implemented yet

Not implemented yet

---------------------------------------

<a name="api-cookiesclearall" />

### cookiesClearAll(): Chromeless<T>

Clears browser cookies.


__Example__

```js
await chromeless.cookiesClearAll()
```

---------------------------------------


## FAQ

### How is this different from [NightmareJS](https://github.com/segmentio/nightmare), PhantomJS or Selenium?

### I'm new to AWS Lambda, is this still for me?

### How much does it cost to run Chromeless in production?

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


## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

![](http://i.imgur.com/5RHR6Ku.png)
