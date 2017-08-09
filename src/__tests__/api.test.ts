import * as CDP from 'chrome-remote-interface'
import { Chromeless, Queue } from '../'
import { defaultLaunchConfig, cleanUpTabs } from '../../utils/test_helper'
import { CookieQuery, DeviceMetrics, Cookie } from '../types'

describe('api constructor', () => {
  const ChromeLocal = require('../chrome/local')
  const ChromeRemote = require('../chrome/remote')

  beforeEach(() => {
    jest.spyOn(ChromeRemote, 'default').mockImplementation(() => {})
    jest.spyOn(ChromeLocal, 'default').mockImplementation(() => {})
  })

  afterEach(() => {
    ChromeRemote.default.mockRestore()
    ChromeLocal.default.mockRestore()
  })

  test('default options', () => {
    new Chromeless()
    expect(ChromeLocal.default).toHaveBeenCalledTimes(1)
    expect(ChromeRemote.default).not.toHaveBeenCalled()
  })

  test('when remote', () => {
    new Chromeless({
      remote: true,
    })
    expect(ChromeRemote.default).toHaveBeenCalledTimes(1)
    expect(ChromeLocal.default).not.toHaveBeenCalled()
  })
})

describe('api', () => {
  let enqueuSpy
  let processSpy
  let chromeless

  beforeEach(() => {
    enqueuSpy = jest.spyOn(Queue.prototype, 'enqueue')
    processSpy = jest.spyOn(Queue.prototype, 'process')
    chromeless = new Chromeless(defaultLaunchConfig)
  })

  afterEach(async () => {
    enqueuSpy.mockRestore()
    processSpy.mockRestore()
    await cleanUpTabs()
  })

  test('methods Not implemented yet', () => {
    const methods = ['back', 'forward', 'refresh', 'mouseover']
    methods.forEach(m => {
      try {
        chromeless[m]()
      } catch (err) {
        expect(err.message).toBe('Not implemented yet')
      }
    })
  })

  test('clearCache', async () => {
    await chromeless.clearCache()
    expect(enqueuSpy).toHaveBeenCalledWith({ type: 'clearCache' })
  })

  test('setUserAgent', async () => {
    await chromeless.setUserAgent('some ua')
    expect(enqueuSpy).toHaveBeenCalledWith({ type: 'setUserAgent', useragent: 'some ua' })
  })

  describe('wait actions', () => {
    test('wait - timeout', async () => {
      await chromeless.wait(11)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'wait', timeout: 11 })
    })

    test('wait - selector', async () => {
      await chromeless.wait('div')
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'wait', selector: 'div' })
    })

    test('wait - function', async () => {
      const fn = () => !!document.body
      await chromeless.wait(fn)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'wait', fn, args: [] })
    })

    test('wait - function with arg', async () => {
      const fn = () => !!document.body
      await chromeless.wait(fn, 'something')
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'wait', fn, args: ['something'] })
    })

    test('wait - with invalid', async () => {
      try {
        await chromeless.wait({} as string)
      } catch (err) {
        expect(err.message).toBe(`Invalid wait arguments: ${{}} `)
      }
    })
  })

  describe('keyboard actions', () => {
    test('focus', async () => {
      const selector = 'div'
      await chromeless.focus(selector)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'focus', selector })
    })

    test('press', async () => {
      const keyCode = 42
      const count = undefined
      const modifiers = undefined
      await chromeless.press(keyCode)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'press', keyCode, count, modifiers })
    })

    test('press with count', async () => {
      const keyCode = 42
      const count = 3333
      const modifiers = undefined
      await chromeless.press(keyCode, count)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'press', keyCode, count, modifiers })
    })

    test('press with count and modifiers', async () => {
      const keyCode = 42
      const count = 3333
      const modifiers = 'something'
      await chromeless.press(keyCode, count, modifiers)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'press', keyCode, count, modifiers })
    })

    test('type - no selector', async () => {
      const input = 'hi'
      await chromeless.type('hi')
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'type', input })
    })

    test('type - with selector', async () => {
      const input = 'hi'
      const selector = 'div'
      await chromeless.type('hi', selector)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'type', input, selector })
    })

    test('clearInput', async () => {
      const selector = 'input'
      await chromeless.clearInput(selector)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'clearInput', selector })
    })

    test('setFileInput with single file name', async () => {
      const selector = 'input'
      const files = 'some/file.txt'
      await chromeless.setFileInput(selector, files)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'setFileInput', selector, files: [files] })
    })

    test('setFileInput with array of file names', async () => {
      const selector = 'input'
      const files = ['some/file.txt', 'another/file.txt']
      await chromeless.setFileInput(selector, files)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'setFileInput', selector, files })
    })
  })

  describe('mouse actions and scolling', () => {
    test('click', async () => {
      const selector = 'div'
      await chromeless.click(selector)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'click', selector })
    })

    test('mousedown', async () => {
      const selector = 'p'
      await chromeless.mousedown(selector)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'mousedown', selector })
    })

    test('mouseup', async () => {
      const selector = 'span'
      await chromeless.mouseup(selector)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'mouseup', selector })
    })

    test('scrollTo', async () => {
      const x = 1000
      const y = 2300
      await chromeless.scrollTo(x, y)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'scrollTo', x, y })
    })

    test('scrollToElement', async () => {
      const selector = 'span'
      await chromeless.scrollToElement(selector)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'scrollToElement', selector })
    })
  })

  describe('cookies', () => {
    test('get cookies for current url', async () => {
      return chromeless.cookies().then(cookies => {
        expect(cookies).toBeTruthy()
        expect(processSpy).toHaveBeenCalledWith({
          type: 'cookies',
          nameOrQuery: undefined,
        })
      })
    })

    test('get cookie by name', async () => {
      const cookies = await chromeless.cookies('aname')
      expect(cookies).toBeTruthy()
      expect(processSpy).toHaveBeenCalledWith({
        type: 'cookies',
        nameOrQuery: 'aname',
      })
    })

    test('Not Implemented: cookie by query', async () => {
      try {
         await chromeless.cookies({} as CookieQuery)
      } catch (err) {
        expect(err.message).toBe('Querying cookies is not implemented yet')
      }

      expect(processSpy).not.toHaveBeenCalled()
    })

    test('allCookies', async () => {
      const cookies = await chromeless.allCookies()
      expect(cookies).toBeTruthy()
      expect(processSpy).toHaveBeenCalledWith({
        type: 'allCookies',
      })
    })

    test('setCookies with name and value', async () => {
      const nameOrCookies = 'aname'
      const value = 'avalue'
      await chromeless.setCookies(nameOrCookies, value)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'setCookies', nameOrCookies, value })
    })

    test('setCookies Cookie interface', async () => {
      const nameOrCookies = {} as Cookie
      const value = undefined
      await chromeless.setCookies(nameOrCookies)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'setCookies', nameOrCookies, value })
    })

    test('setCookies Cookie[] interface', async () => {
      const nameOrCookies: Cookie[] = [{} as Cookie, {} as Cookie]
      const value = undefined
      await chromeless.setCookies(nameOrCookies)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'setCookies', nameOrCookies, value })
    })

    test('deleteCookies', async () => {
      const name = 'aname'
      const url = 'http://example.com'
      await chromeless.deleteCookies(name, url)
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'deleteCookies', name, url })
    })

    test('deleteCookies exceptions', async () => {
      let name = undefined as string
      let url = 'http://example.com'

      try {
        await await chromeless.deleteCookies(name, url)
      } catch (err) {
        expect(err.message).toBe('Cookie name should be defined.')
      }

      name = 'aname'
      url = undefined as string
      try {
        await await chromeless.deleteCookies(name, url)
      } catch (err) {
        expect(err.message).toBe('Cookie url should be defined.')
      }
    })

    test('clearCookies', async () => {
      await chromeless.clearCookies()
      expect(enqueuSpy).toHaveBeenCalledWith({ type: 'clearCookies' })
    })
  })

  test('screenshot and pdf path', async () => {
    const screenshot = await chromeless
      .goto('https://www.google.com')
      .screenshot()

    // there's a concurrency issue when running all tests at once,
    // so it could end up having the S3 ENV vars set from the local-runtime tests,
    // meaning it would output a URL instead the file
    // expect(screenshot).toContain(os.tmpdir())
    expect(screenshot.endsWith('.png')).toBe(true)
  })

  test('print to pdf', async () => {
    // not implemented in non-headless mode
    const info = await CDP.Version(defaultLaunchConfig.cdp)
    const isHeadless = info['User-Agent'].includes('Headless')

    let error
    let filePath
    try {
      process.env['CHROMELESS_S3_BUCKET_NAME'] = undefined
      filePath = await chromeless.goto('https://www.google.com').pdf()
    } catch (err) {
      error = err
    }

    if (isHeadless) {
      expect(error).toBeUndefined()
      // There's a concurrency issue when running all tests at once,
      // so it could end up having the S3 ENV vars set from the local-runtime tests,
      // meaning it would output a URL instead the file
      // expect(filePath).toContain(os.tmpdir())
      expect(filePath.endsWith('.pdf')).toBe(true)
    } else  {
      expect(filePath).toBeUndefined()
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('PrintToPDF is not implemented')
    }
  })

  test('setViewport', async () => {
    const options: DeviceMetrics = {
      width: 1000,
      height: 3000
    }
    await chromeless.setViewport(options)
    expect(enqueuSpy).toHaveBeenCalledWith({ type: 'setViewport', options })
  })

  test('setHtml', async () => {
    const html = 'some html'
    await chromeless.setHtml(html)
    expect(enqueuSpy).toHaveBeenCalledWith({ type: 'setHtml', html })
  })

  test('inputValue', async () => {
    const selector = 'input'
    return chromeless.inputValue(selector).catch(err => {
      expect(err).toBeInstanceOf(Error)
      expect(processSpy).toHaveBeenCalledTimes(1)
      expect(processSpy).toHaveBeenCalledWith({
        type: 'returnInputValue',
        selector,
      })
    })
  })

  test('exists', async () => {
    const selector = 'input'
    const val = await chromeless.exists(selector)
    expect(val).toBe(false)
    expect(processSpy).toHaveBeenCalledTimes(1)
    expect(processSpy).toHaveBeenCalledWith({
      type: 'returnExists',
      selector,
    })
  })

  test('html', async () => {
    const val = await chromeless.html()
    expect(val).toBeTruthy()
    expect(processSpy).toHaveBeenCalledTimes(1)
    expect(processSpy).toHaveBeenCalledWith({
      type: 'returnHtml',
    })
  })

  describe('evaluate', () => {
    test('google title', async () => {
      const title = await chromeless
        .goto('https://www.google.com')
        .evaluate(() => document.title)
      expect(title).toBe('Google')
    })

    test('3 character in google title', async () => {
      const title = await chromeless
        .goto('https://www.google.com')
        .evaluate((nthChar) => document.title[nthChar], 3)
      expect(title).toBe('g')
    })
  })

  test('end()', async () => {
    const qEndSpy = jest.spyOn(Queue.prototype, 'end')
    const c: Chromeless<any> = new Chromeless({}, chromeless.goto('http://example.com'))
    expect(c['queue']).toBe(chromeless['queue'])
    expect(c['lastReturnPromise']).toBe(chromeless['lastReturnPromise'])
    const loc = await c.evaluate(() => location.hostname).end()
    expect(loc).toBe('example.com')
    expect(qEndSpy).toHaveBeenCalledTimes(1)
  })
})