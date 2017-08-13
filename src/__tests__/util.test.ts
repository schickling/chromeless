import * as BrowserExpressions from '../browser-expressions'

import { Client, Cookie } from '../types'
import * as Utils from '../util'
import { resolveValue, mockClientFactory } from '../../utils/test_helper'

describe('util', () => {
  let client: Client
  beforeEach(() => {
    client = mockClientFactory()
    jest.spyOn(BrowserExpressions, 'getClientRect').mockImplementation(
      resolveValue({
        left: 1,
        top: 2,
        right: 3,
        bottom: 4,
        height: 5,
        width: 6,
      }),
    )
  })

  test('version', () => {
    expect(Utils.version).toBe(require('../../package.json').version)
  })

  describe('setViewport()', () => {
    test('sets view ports with default DeviceMetrics', async () => {
      const client = mockClientFactory()
      await Utils.setViewport(client)
      expect(client.Emulation.setDeviceMetricsOverride).toHaveBeenCalledWith({
        deviceScaleFactor: 1,
        mobile: false,
        scale: 1,
        fitWindow: false,
        height: 1,
        width: 1,
      })
    })

    test('sets view ports with defaults for Headless', async () => {
      const client: Client = mockClientFactory()
      client.ChromeInfo['User-Agent'] = 'Headless'
      await Utils.setViewport(client, {
        width: 0,
        height: 0,
        scale: 0,
      })
      expect(client.Emulation.setDeviceMetricsOverride).toHaveBeenCalledWith({
        deviceScaleFactor: 1,
        mobile: false,
        scale: 1,
        fitWindow: false,
        height: 900,
        width: 1440,
      })
      expect(client.Emulation.setVisibleSize).toHaveBeenCalledWith({
        width: 1440,
        height: 900,
      })
    })

    test('sets viewport to fit the document', async () => {
      const client: Client = mockClientFactory()
      client.Runtime.evaluate
        .mockImplementationOnce(resolveValue({ result: { value: 66 } })) // height
        .mockImplementationOnce(resolveValue({ result: { value: 33 } })) // width

      await Utils.setViewport(client, {
        width: 0,
        height: 0,
      })

      expect(client.Emulation.setDeviceMetricsOverride).toHaveBeenCalledWith({
        deviceScaleFactor: 1,
        mobile: false,
        scale: 1,
        fitWindow: false,
        height: 66,
        width: 33,
      })
      expect(client.Emulation.setVisibleSize).toHaveBeenCalledWith({
        width: 33,
        height: 66,
      })

      expect(client.Runtime.evaluate).toHaveBeenCalledWith({
        expression: expect.any(String),
        returnByValue: true,
        awaitPromise: true,
      })
    })
  })

  describe('waitForNode()', () => {
    const now = Date.now()
    beforeEach(() => {
      Date.prototype.getTime = jest.fn(() => now)
      window.setInterval = jest.fn(cb => {
        cb()
        return 123
      })
      window.clearInterval = jest.fn()
    })

    it('returns right away if exists', async () => {
      const client: Client = mockClientFactory()
      client.Runtime.evaluate.mockImplementationOnce(
        resolveValue({ result: { value: 'something' } }),
      )

      expect(await Utils.waitForNode(client, 'div', 10000)).toBeUndefined()
      expect(client.Runtime.evaluate).toHaveBeenCalledWith({
        expression: expect.any(String),
      })
      const passedExp = client.Runtime.evaluate.mock.calls[0][0].expression
      expect(window.setInterval).not.toHaveBeenCalled()
      expect(window.clearInterval).not.toHaveBeenCalled()
    })

    it('checks again every 500 ms', async () => {
      const client: Client = mockClientFactory()
      client.Runtime.evaluate
        .mockImplementationOnce(resolveValue({ result: { value: null } }))
        .mockImplementationOnce(
          resolveValue({ result: { value: 'something' } }),
        )

      const prom = Utils.waitForNode(client, 'div', 10000)
      expect(await prom).toBeUndefined()

      expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 500)
      expect(window.clearInterval).toHaveBeenCalledWith(123)

      expect(client.Runtime.evaluate).toHaveBeenCalledTimes(2)
      expect(client.Runtime.evaluate).toHaveBeenCalledWith({
        expression: expect.any(String),
      })
    })

    it('rejects after waitTimeout', async () => {
      Date.prototype.getTime = jest
        .fn()
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 11000)

      client.Runtime.evaluate.mockImplementation(
        resolveValue({ result: { value: null } }),
      )

      const prom = Utils.waitForNode(client, 'div', 10000)
      try {
        expect(await prom).toBeUndefined()
      } catch (err) {
        expect(err.message).toBe(`wait("div") timed out after 10000ms`)
      }

      expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 500)
      expect(window.clearInterval).toHaveBeenCalledTimes(1)

      expect(client.Runtime.evaluate).toHaveBeenCalledTimes(2)
    })
  })

  it('wait()', async () => {
    window.setTimeout = jest.fn(cb => cb())
    await Utils.wait(1000)
    expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000)
  })

  test('nodeExists()', async () => {
    client.Runtime.evaluate = jest.fn(
      resolveValue({
        result: { value: true },
      }),
    )
    expect(await Utils.nodeExists(client, 'div.blah')).toBe(true)
    expect(client.Runtime.evaluate).toHaveBeenCalledWith({
      expression: expect.any(String),
    })
  })

  test('click()', async () => {
    const clientRect = {
      left: 1,
      top: 2,
      right: 3,
      bottom: 4,
      height: 5,
      width: 6,
    }

    client.Runtime.evaluate = jest.fn(
      resolveValue({
        result: {
          value: JSON.stringify(clientRect),
        },
      }),
    )

    await Utils.click(client, 'div', 2)
    const expectedOpts = {
      x: Math.round((clientRect.left + clientRect.width / 2) * 2),
      y: Math.round((clientRect.top + clientRect.height / 2) * 2),
      button: 'left',
      clickCount: 1,
    }
    const dispatchCalls = client.Input.dispatchMouseEvent.mock.calls
    expect(dispatchCalls).toHaveLength(2)
    expect(dispatchCalls[0][0]).toEqual({
      ...expectedOpts,
      type: 'mousePressed',
    })
    expect(dispatchCalls[1][0]).toEqual({
      ...expectedOpts,
      type: 'mouseReleased',
    })
  })

  test('focus()', async () => {
    await Utils.focus(client, 'div.something')
    expect(client.DOM.getDocument).toHaveBeenCalledTimes(1)
    expect(client.DOM.querySelector).toHaveBeenCalledWith({
      nodeId: 222,
      selector: 'div.something',
    })
    expect(client.DOM.focus).toHaveBeenCalledWith({ id: 'default-id' })
  })

  describe('evaluate()', () => {
    test('evaluates javascript in browser', async () => {
      client.Runtime.evaluate = jest.fn(resolveValue())

      const ret = await Utils.evaluate(client, 'fn()')
      expect(ret).toBeNull()

      expect(client.Runtime.evaluate).toHaveBeenCalled()
    })

    test('excepts if expression throws error', async () => {
      client.Runtime.evaluate = jest.fn(
        resolveValue({
          exceptionDetails: {
            exception: { value: 'some pesky error' },
          },
        }),
      )

      let errorThrown
      try {
        await Utils.evaluate(client, 'fn()')
      } catch (err) {
        errorThrown = err
        expect(err.message).toBe('some pesky error')
      }
      expect(errorThrown).toBeInstanceOf(Error)
      expect(client.Runtime.evaluate).toHaveBeenCalledWith({
        expression: expect.any(String),
        returnByValue: true,
        awaitPromise: true,
      })
    })

    test('excepts and uses description if value is falsy', async () => {
      client.Runtime.evaluate = jest.fn(
        resolveValue({
          exceptionDetails: {
            exception: { description: 'some pesky error descriptions' },
          },
        }),
      )

      const randomArgs = `something_${Math.random()}`
      try {
        await Utils.evaluate(client, 'fn()', randomArgs)
      } catch (err) {
        expect(err.message).toBe('some pesky error descriptions')
      }

      // testing to see if the arg we passed made it to the expression
      expect(client.Runtime.evaluate.mock.calls[0][0].expression).toContain(
        randomArgs,
      )
    })
  })

  describe('type()', () => {
    it('sends key events', async () => {
      const dispatchKeyEvent = client.Input.dispatchKeyEvent
      await Utils.type(client, 'ab')
      expect(dispatchKeyEvent).toHaveBeenCalledTimes(2)
      expect(dispatchKeyEvent).toHaveBeenCalledWith({
        type: 'char',
        text: 'a',
        unmodifiedText: 'a',
      })
      expect(dispatchKeyEvent).toHaveBeenCalledWith({
        type: 'char',
        text: 'b',
        unmodifiedText: 'b',
      })
    })

    it('focuses and waits 500 ms if selector is passed', async () => {
      window.setTimeout = jest.fn(cb => cb())
      const dispatchKeyEvent = client.Input.dispatchKeyEvent
      await Utils.type(client, 'a', '#some-id')

      expect(client.DOM.focus).toHaveBeenCalledTimes(1)
      expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 500)
      expect(dispatchKeyEvent).toHaveBeenCalledTimes(1)
      expect(dispatchKeyEvent).toHaveBeenCalledWith({
        type: 'char',
        text: 'a',
        unmodifiedText: 'a',
      })
    })
  })

  describe('press()', () => {
    it('dispatches key event pairs', async () => {
      const dispatchKeyEvent = client.Input.dispatchKeyEvent
      const keyCode = 33
      await Utils.press(client, keyCode)
      expect(dispatchKeyEvent).toHaveBeenCalledTimes(2)
      const expectedOpts = {
        nativeVirtualKeyCode: keyCode,
        windowsVirtualKeyCode: keyCode,
      }
      expect(dispatchKeyEvent).toHaveBeenCalledWith({
        ...expectedOpts,
        type: 'rawKeyDown',
      })
      expect(dispatchKeyEvent).toHaveBeenCalledWith({
        ...expectedOpts,
        type: 'keyUp',
      })
    })

    it('handles multiples presses', async () => {
      const dispatchKeyEvent = client.Input.dispatchKeyEvent
      const keyCode = 33
      await Utils.press(client, keyCode, 2)
      expect(dispatchKeyEvent).toHaveBeenCalledTimes(4)
    })

    it('handles optional modifiers', async () => {
      const dispatchKeyEvent = client.Input.dispatchKeyEvent
      const keyCode = 33
      await Utils.press(client, keyCode, 1, 'a mod')
      expect(dispatchKeyEvent).toHaveBeenCalledTimes(2)
      const expectedOpts = {
        nativeVirtualKeyCode: keyCode,
        windowsVirtualKeyCode: keyCode,
        modifiers: 'a mod',
      }
      expect(dispatchKeyEvent).toHaveBeenCalledWith({
        ...expectedOpts,
        type: 'rawKeyDown',
      })
      expect(dispatchKeyEvent).toHaveBeenCalledWith({
        ...expectedOpts,
        type: 'keyUp',
      })
    })
  })

  test('getValue()', async () => {
    client.Runtime.evaluate.mockImplementation(
      resolveValue({
        result: { value: 42 },
      }),
    )
    expect(await Utils.getValue(client, 'input')).toBe(42)
    expect(client.Runtime.evaluate).toHaveBeenCalledWith({
      expression: expect.any(String),
    })
  })

  test('scrollTo()', async () => {
    await Utils.scrollTo(client, 10, 20)
    const exp = client.Runtime.evaluate.mock.calls[0][0].expression
    expect(exp).toContain('window.scrollTo(x, y)')
    expect(exp).toContain(')(10, 20)')
  })

  test('scrollToElement()', async () => {
    client.Runtime.evaluate = jest.fn(resolveValue())
    await Utils.scrollToElement(client, '#an-id')
    expect(client.Runtime.evaluate).toHaveBeenCalledWith({
      expression: `(${BrowserExpressions.BROWSER_EXPRESSIONS.window
        .scrollTo})(1, 2)`,
    })
  })

  test('setHtml()', async () => {
    client.Page.getResourceTree = jest.fn(
      resolveValue({
        frameTree: {
          frame: { id: 'some-id' },
        },
      }),
    )
    client.Page.setDocumentContent = jest.fn(resolveValue())
    await Utils.setHtml(client, '<div />')
    expect(client.Page.getResourceTree).toHaveBeenCalledTimes(1)
    expect(client.Page.setDocumentContent).toHaveBeenCalledWith({
      frameId: 'some-id',
      html: '<div />',
    })
  })

  describe('cookies', () => {
    beforeEach(() => {
      // expecting this to run an array
      client.Network.getCookies = jest.fn(
        resolveValue({
          cookies: [
            {
              name: 'acookie',
              value: 'avalue',
            },
          ],
        }),
      )
      client.Runtime.evaluate.mockImplementation(
        resolveValue({
          result: { value: 'http://example.com' },
        }),
      )

      // expecting this to run an array
      client.Network.getAllCookies = jest.fn(
        resolveValue({
          cookies: [
            {
              name: 'acookie',
              value: 'avalue',
            },
          ],
        }),
      )
      client.Network.setCookie = jest.fn(resolveValue())
      client.Network.deleteCookie = jest.fn(resolveValue())
    })

    test('finds by exact cookie name', async () => {
      const nothingFound = await Utils.getCookies(client, 'not_found')
      expect(nothingFound).toEqual([])

      const found = await Utils.getCookies(client, 'acookie')
      expect(found).toEqual([
        {
          name: 'acookie',
          value: 'avalue',
        },
      ])
    })

    test('gets url and calls Network.getCookies', async () => {
      const cookies = await Utils.getCookies(client)
      expect(cookies).toEqual([
        {
          name: 'acookie',
          value: 'avalue',
        },
      ])
      expect(client.Network.getCookies).toHaveBeenCalledWith([
        'http://example.com',
      ])
    })

    test('getAllCookies()', async () => {
      const cookies = await Utils.getAllCookies(client)
      expect(cookies).toEqual([
        {
          name: 'acookie',
          value: 'avalue',
        },
      ])
      expect(client.Network.getAllCookies).toHaveBeenCalledTimes(1)
    })

    test('setCookies()', async () => {
      const cookies: Cookie[] = [
        { name: 'some', value: 'val1' },
        { name: 'another', value: 'val2', domain: '.example.com' },
        { name: 'andanother', value: 'val3', domain: 'sub.example.com' },
      ]
      await Utils.setCookies(client, cookies)
      expect(client.Network.setCookie).toHaveBeenCalledTimes(3)
      expect(client.Network.setCookie.mock.calls[0][0]).toEqual({
        name: 'some',
        value: 'val1',
      })
      expect(client.Network.setCookie.mock.calls[1][0]).toEqual({
        name: 'another',
        value: 'val2',
        domain: '.example.com',
        url: 'https://example.com',
      })
      expect(client.Network.setCookie.mock.calls[2][0]).toEqual({
        name: 'andanother',
        value: 'val3',
        domain: 'sub.example.com',
        url: 'https://sub.example.com',
      })
    })

    test('deleteCookie', async () => {
      await Utils.deleteCookie(client, 'acookie', 'http://example.com')
      expect(client.Network.deleteCookie).toHaveBeenCalledWith({
        cookieName: 'acookie',
        url: 'http://example.com',
      })
    })

    test('clears cookies', async () => {
      const val = await Utils.clearCookies(client)
      expect(val).toBeUndefined()
      expect(client.Network.clearBrowserCookies).toHaveBeenCalledTimes(1)
    })
  })

  describe('mouse', () => {
    const clientRect = {
      left: 1,
      top: 2,
      right: 3,
      bottom: 4,
      height: 5,
      width: 6,
    }

    beforeEach(() => {
      client.Runtime.evaluate = jest.fn(
        resolveValue({
          result: { value: JSON.stringify(clientRect) },
        }),
      )
    })

    test('mousedown()', async () => {
      await Utils.mousedown(client, '#id', 3)
      expect(client.Input.dispatchMouseEvent).toHaveBeenCalledWith({
        x: Math.round((clientRect.left + clientRect.width / 2) * 3),
        y: Math.round((clientRect.top + clientRect.height / 2) * 3),
        button: 'left',
        clickCount: 1,
        type: 'mousePressed',
      })
    })

    test('mouseup()', async () => {
      await Utils.mouseup(client, '#id', 1.5)
      expect(client.Input.dispatchMouseEvent).toHaveBeenCalledWith({
        x: Math.round((clientRect.left + clientRect.width / 2) * 1.5),
        y: Math.round((clientRect.top + clientRect.height / 2) * 1.5),
        button: 'left',
        clickCount: 1,
        type: 'mouseReleased',
      })
    })
  })

  test('screenshot()', async () => {
    const s = await Utils.screenshot(client)
    expect(s).toBe('some_blob')
    expect(client.Page.captureScreenshot).toHaveBeenCalledWith({
      format: 'png',
    })
  })

  test('pdf()', async () => {
    const s = await Utils.pdf(client)
    expect(s).toBe('pdf_blob')
    expect(client.Page.printToPDF).toHaveBeenCalledWith(undefined)
  })

  test('pdf() with options', async () => {
    const s = await Utils.pdf(client, { landscape: false })
    expect(s).toBe('pdf_blob')
    expect(client.Page.printToPDF).toHaveBeenCalledWith({ landscape: false })
  })

  test('html()', async () => {
    client.DOM.getDocument = jest.fn(
      resolveValue({ root: { nodeId: 'some-id' } }),
    )
    client.DOM.getOuterHTML = jest.fn(resolveValue({ outerHTML: 'outer html' }))
    const h = await Utils.html(client)
    expect(h).toBe('outer html')
    const { DOM } = client
    expect(DOM.getDocument).toHaveBeenCalledTimes(1)
    expect(DOM.getOuterHTML).toHaveBeenCalledWith({ nodeId: 'some-id' })
  })

  test('clearInput()', async () => {
    window.setTimeout = jest.fn(cb => cb())
    const { Input } = client
    // getValue
    client.Runtime.evaluate = jest.fn(
      resolveValue({ result: { value: 'abc' } }),
    )
    await Utils.clearInput(client, '#id')
    // wait(500)
    expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 500)
    expect(Input.dispatchKeyEvent).toHaveBeenCalledTimes('abc'.length * 4)

    // delete
    expect(Input.dispatchKeyEvent).toHaveBeenCalledWith({
      nativeVirtualKeyCode: 46,
      windowsVirtualKeyCode: 46,
      type: 'rawKeyDown',
    })
    expect(Input.dispatchKeyEvent).toHaveBeenCalledWith({
      nativeVirtualKeyCode: 46,
      windowsVirtualKeyCode: 46,
      type: 'keyUp',
    })
    expect(Input.dispatchKeyEvent).toHaveBeenCalledWith({
      nativeVirtualKeyCode: 8,
      windowsVirtualKeyCode: 8,
      type: 'rawKeyDown',
    })
    expect(Input.dispatchKeyEvent).toHaveBeenCalledWith({
      nativeVirtualKeyCode: 8,
      windowsVirtualKeyCode: 8,
      type: 'keyUp',
    })
  })

  test('getDebugOption()', () => {
    expect(Utils.getDebugOption()).toBe(false)
    const d = process.env.DEBUG
    process.env.DEBUG = 'chromeless'
    const expTrue = Utils.getDebugOption()
    // set it back
    process.env.DEBUG = d
    expect(expTrue).toBe(true)
  })

  test('setFileInput()', async () => {
    client.DOM.getDocument = jest.fn(
      resolveValue({
        root: { nodeId: 'id' },
      }),
    )
    client.DOM.setFileInput = jest.fn(resolveValue())
    await Utils.setFileInput(client, 'div', ['files'])
    expect(client.DOM.getDocument).toHaveBeenCalledTimes(1)
    expect(client.DOM.querySelector).toHaveBeenCalledWith({
      nodeId: 'id',
      selector: 'div',
    })
    expect(client.DOM.setFileInputFiles).toHaveBeenCalledWith({
      files: ['files'],
    })
  })
})
