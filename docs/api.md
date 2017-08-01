# API Documentation

Chromeless provides TypeScript typings.

**Chromeless methods**
- [`end()`](#api-end)

**Chrome methods**
- [`goto(url: string)`](#api-goto)
- [`click(selector: string)`](#api-click)
- [`wait(timeout: number)`](#api-wait-timeout)
- [`wait(selector: string)`](#api-wait-selector)
- [`wait(fn: (...args: any[]) => boolean, ...args: any[])`] - Not implemented yet
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
- [`cookiesDelete(name: string)`](#api-cookiesdelete)
- [`cookiesClear()`](#api-cookiesclear)


---------------------------------------

<a name="api-end" />

### end(): Promise<T>

End the Chromeless session. Locally this will disconnect from Chrome. Over the Proxy, this will end the session, terminating the Lambda function.
It returns the last value that has been evaluated.

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

Not implemented yet

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
- `count` - How many times to send the key press
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

### cookiesDelete(name: string) - Not implemented yet

Delete a specific cookie.

__Arguments__
- `name` - name of the cookie

__Example__

```js
await chromeless.cookiesDelete('cookieName')
```

---------------------------------------

<a name="api-cookiesclear" />

### cookiesClear(): Chromeless<T>

Clears all browser cookies.

__Example__

```js
await chromeless.cookiesClear()
```
