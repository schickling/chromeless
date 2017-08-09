jest.mock('aws-sdk')
const AWS = require('aws-sdk')
jest.mock('cuid', () => jest.fn(() => 'some-uid'))
const Util = require('../../util')
jest.mock('../../util')
import * as path from 'path'
import * as os from 'os'
import LocalRuntime from '../local-runtime'
import { resolveValue, mockClientFactory } from '../../../utils/test_helper'
import { ChromelessOptions, Client, DeviceMetrics, Cookie, Command, PdfOptions } from '../../types'
import { BROWSER_EXPRESSIONS } from '../../browser-expressions'

describe('local-runtime', () => {
  let client: Client
  let localRuntime: LocalRuntime
  let localRuntimeNoWait: LocalRuntime

  beforeEach(() => {
    Util.nodeExists
      .mockImplementation((client, selector) => Promise.resolve(selector !== '#missing'))
    client = mockClientFactory()
    localRuntime = new LocalRuntime(client, {
      waitTimeout: 2000,
      implicitWait: true,
      viewport: {
        height: 500,
        width: 600,
        scale: 2,
      }
    } as ChromelessOptions)

    localRuntimeNoWait = new LocalRuntime(client, {
      waitTimeout: 2000,
      implicitWait: false,
      scrollBeforeClick: true,
      viewport: {
        height: 500,
        width: 600,
        scale: 2,
      }
    } as ChromelessOptions)
  })

  afterEach(() => {
    // This is deprecated but .resetAllMocks clears the implementation,
    // we just want to clear the calls
    jest.clearAllMocks()
  })

  describe('run', () => {
    test('goto() default user agent', async () => {
      await localRuntime.run({
        type: 'setUserAgent',
        useragent: 'some ua',
      })
      expect(localRuntime['userAgentValue']).toBe('some ua')

      await localRuntime.run({
        type: 'goto',
        url: 'http://blah.com/yay'
      })
      const { Network, Page } = client
      expect(Network.enable).toHaveBeenCalledTimes(1)
      expect(Page.enable).toHaveBeenCalledTimes(1)
      expect(Network.setUserAgentOverride).toHaveBeenCalledWith({
        userAgent: 'some ua',
      })
      expect(Page.navigate).toHaveBeenCalledWith({
        url: 'http://blah.com/yay',
      })
      expect(Page.loadEventFired).toHaveBeenCalledTimes(1)
    })

    test('setViewPort', async () => {
      await localRuntime.run({
        type: 'setViewport',
        options: {} as DeviceMetrics
      })
      expect(Util.setViewport).toHaveBeenCalledWith(client, {})
    })

    test('wait - timeout', async () => {
      await localRuntime.run({
        type: 'wait',
        timeout: 1000
      })
      expect(Util.wait).toHaveBeenCalledWith(1000)
    })

    test('wait - selector', async () => {
      await localRuntime.run({
        type: 'wait',
        selector: 'div.class',
      })
      expect(Util.waitForNode).toHaveBeenCalledWith(client, 'div.class', 2000)
    })

    test('wait - not implemented', async () => {
      let err
      try {
        await localRuntime.run({
          type: 'wait',
          fn: `function() {}`,
        })
      } catch (e) {
        err = e
      }

      expect(err.message).toBe('waitFn not yet implemented')
    })

    test('clearCache - can', async () => {
      await localRuntime.run({
        type: 'clearCache',
      })
      expect(client.Network.canClearBrowserCache).toHaveBeenCalledTimes(1)
      expect(client.Network.clearBrowserCache).toHaveBeenCalledTimes(1)
    })

    test('clearCache - cannot', async () => {
      client.Network.canClearBrowserCache = jest.fn(resolveValue(false))
      await localRuntime.run({
        type: 'clearCache',
      })
      expect(client.Network.clearBrowserCache).not.toHaveBeenCalled()
    })

    test('click - no scroll before click', async () => {
      await localRuntime.run({
        type: 'click',
        selector: '#id',
      })
      expect(Util.waitForNode).toHaveBeenCalledWith(client, '#id', 2000)
      expect(Util.nodeExists).toHaveBeenCalledWith(client, '#id')
      expect(Util.scrollToElement).not.toHaveBeenCalled()
      expect(Util.click).toHaveBeenCalledWith(client, '#id', 2)
    })

    test('click - element does not exist', async () => {
      let err
      try {
        await localRuntime.run({
          type: 'click',
          selector: '#missing',
        })
      } catch (e) {
        err = e
      }
      expect(err.message).toBe(`click(): node for selector #missing doesn't exist`)
      expect(Util.nodeExists).toHaveBeenCalledWith(client, '#missing')
    })

    test('click - scroll before click', async () => {
      await localRuntimeNoWait.run({
        type: 'click',
        selector: '#id',
      })
      expect(Util.waitForNode).not.toHaveBeenCalled()
      expect(Util.nodeExists).toHaveBeenCalledWith(client, '#id')
      expect(Util.scrollToElement).toHaveBeenCalledWith(client, '#id')
      expect(Util.click).toHaveBeenCalledWith(client, '#id', 2)
    })

    test('click - element does not exist', async () => {
      let err
      try {
        await localRuntime.run({
          type: 'type',
          input: 'abc',
          selector: '#missing',
        })
      } catch (e) {
        err = e
      }
      expect(err.message).toBe(`type(): Node not found for selector: #missing`)
      expect(Util.nodeExists).toHaveBeenCalledWith(client, '#missing')
    })

    test('type - implicit wait', async () => {
      await localRuntime.run({
        type: 'type',
        input: 'abc',
        selector: '#id',
      })
      expect(Util.waitForNode).toHaveBeenCalledWith(client, '#id', 2000)
      expect(Util.nodeExists).toHaveBeenCalledWith(client, '#id')
      expect(Util.type).toHaveBeenCalledWith(client, 'abc', '#id')
    })

    test('type - no selector', async () => {
      await localRuntime.run({
        type: 'type',
        input: 'abc',
      })
      expect(Util.waitForNode).not.toHaveBeenCalled()
      expect(Util.nodeExists).not.toHaveBeenCalled()
      expect(Util.type).toHaveBeenCalledWith(client, 'abc', undefined)
    })

    test('type - no implicit wait', async () => {
      await localRuntimeNoWait.run({
        type: 'type',
        input: 'abc',
        selector: '#id',
      })
      expect(Util.waitForNode).not.toHaveBeenCalled()
      expect(Util.nodeExists).toHaveBeenCalledWith(client, '#id')
      expect(Util.type).toHaveBeenCalledWith(client, 'abc', '#id')
    })

    test('press', async () => {
      await localRuntimeNoWait.run({
        type: 'press',
        keyCode: 33,
      })

      expect(Util.press).toHaveBeenCalledWith(client, 33, undefined, undefined)
    })

    test('press - with count', async () => {
      await localRuntimeNoWait.run({
        type: 'press',
        keyCode: 33,
        count: 2,
      })

      expect(Util.press).toHaveBeenCalledWith(client, 33, 2, undefined)
    })

    test('press - modifiers', async () => {
      await localRuntimeNoWait.run({
        type: 'press',
        keyCode: 33,
        modifiers: 'some mod',
      })

      expect(Util.press).toHaveBeenCalledWith(client, 33, undefined, 'some mod')
    })

    test('scrollTo', async () => {
      await localRuntime.run({
        type: 'scrollTo',
        x: 22,
        y: 4444,
      })

      expect(Util.scrollTo).toHaveBeenCalledWith(client, 22, 4444)
    })

    test('scrollToElement - implicit wait', async () => {
      await localRuntime.run({
        type: 'scrollToElement',
        selector: '#id',
      })
      expect(Util.waitForNode).toHaveBeenCalledWith(client, '#id', 2000)
      expect(Util.scrollToElement).toHaveBeenCalledWith(client, '#id')
    })

    test('scrollToElement - no implicit wait', async () => {
      await localRuntimeNoWait.run({
        type: 'scrollToElement',
        selector: '#id',
      })
      expect(Util.waitForNode).not.toHaveBeenCalled()
      expect(Util.scrollToElement).toHaveBeenCalledWith(client, '#id')
    })

    test('can delete cookies', async () => {
      await localRuntime.run({
        type: 'deleteCookies',
        name: 'aname',
        url: 'http://example.com',
      })
      expect(client.Network.canClearBrowserCookies).toHaveBeenCalledTimes(1)
      expect(Util.deleteCookie).toHaveBeenCalledWith(client, 'aname', 'http://example.com')
    })

    test('cannot delete cookies', async () => {
      client.Network.canClearBrowserCookies.mockImplementationOnce(resolveValue(false))
      await localRuntime.run({
        type: 'deleteCookies',
        name: 'aname',
        url: 'http://example.com',
      })
      expect(client.Network.canClearBrowserCookies).toHaveBeenCalledTimes(1)
      expect(Util.deleteCookie).not.toHaveBeenCalled()
    })

    test('can clear cookies', async () => {
      await localRuntime.run({
        type: 'clearCookies',
      })
      expect(client.Network.canClearBrowserCookies).toHaveBeenCalledTimes(1)
      expect(Util.clearCookies).toHaveBeenCalledTimes(1)
    })

    test('cannot clear cookies', async () => {
      client.Network.canClearBrowserCookies.mockImplementationOnce(resolveValue(false))
      await localRuntime.run({
        type: 'clearCookies',
      })
      expect(client.Network.canClearBrowserCookies).toHaveBeenCalledTimes(1)
      expect(Util.clearCookies).not.toHaveBeenCalled()
    })

    test('setCookies by Cookie', async () => {
      await localRuntime.run({
        type: 'setCookies',
        nameOrCookies: {} as Cookie,
      })
      expect(Util.setCookies).toHaveBeenCalledWith(client, [{}])

      await localRuntime.run({
        type: 'setCookies',
        nameOrCookies: [{} as Cookie, {} as Cookie],
      })
      expect(Util.setCookies).toHaveBeenCalledWith(client, [{}, {}])
    })

    test('setCookies by name, value', async () => {
      Util.evaluate.mockImplementationOnce(resolveValue('http://website.tld/blah'))
      await localRuntime.run({
        type: 'setCookies',
        nameOrCookies: 'aname',
        value: 'avalue'
      })
      expect(Util.evaluate).toHaveBeenCalledWith(client, BROWSER_EXPRESSIONS.location.href)
      expect(Util.setCookies).toHaveBeenCalledWith(client, [{name: 'aname', value: 'avalue', url: 'http://website.tld/blah'}])
    })

    test('setCookies throws exception', async () => {
      let err
      try {
        await localRuntime.run({
          type: 'setCookies',
          nameOrCookies: {} as Cookie,
          value: 'avalue'
        })
      } catch (e) {
        err = e
      }
      expect(err.message).toBe(`setCookies(): Invalid input ${{}}, avalue`)
      expect(Util.setCookies).not.toHaveBeenCalled()
    })

    test('setHtml', async () => {
      await localRuntime.run({
        type: 'setHtml',
        html: '<div />'
      })
      expect(Util.setHtml).toHaveBeenCalledWith(client, '<div />')
    })

    test('returnInputValue', async () => {
      await localRuntime.run({
        type: 'returnInputValue',
        selector: 'input.class'
      })
      expect(Util.getValue).toHaveBeenCalledWith(client, 'input.class')
    })

    describe('setFileInput', () => {
      const cmd = 'setFileInput'
      const files = ['some/file.txt']

      test(`${cmd} - implicit wait`, async () => {
        await localRuntime.run({
          type: cmd,
          selector: '#id',
          files
        } as Command)
        expect(Util.waitForNode).toHaveBeenCalledWith(client, '#id', 2000)
        expect(Util[cmd]).toHaveBeenCalledWith(client, '#id', files)
      })

      test(`${cmd} - no implicit wait`, async () => {
        await localRuntimeNoWait.run({
          type: cmd,
          selector: '#id',
          files,
        } as Command)
        expect(Util.waitForNode).not.toHaveBeenCalled()
        expect(Util[cmd]).toHaveBeenCalledWith(client, '#id', files)
      })

      test(`${cmd} - element does not exist`, async () => {
        let err
        try {
          await localRuntime.run({
            type: cmd,
            selector: '#missing',
          } as Command)
        } catch (e) {
          err = e
        }
        expect(err.message).toBe(`${cmd}(): node for selector #missing doesn't exist`)
        expect(Util.nodeExists).toHaveBeenCalledWith(client, '#missing')
      })
    })


    const commonFunctions = 'mouseup | mousedown | focus | clearInput'
    describe(commonFunctions, async () => {
      await commonFunctions.split(' | ').forEach(async (cmd: string) => {
        test(`${cmd} - implicit wait`, async () => {
          await localRuntime.run({
            type: cmd,
            selector: '#id',
          } as Command)
          expect(Util.waitForNode).toHaveBeenCalledWith(client, '#id', 2000)
          if (cmd.includes('mouse')) {
            expect(Util[cmd]).toHaveBeenCalledWith(client, '#id', 2)
          } else {
            expect(Util[cmd]).toHaveBeenCalledWith(client, '#id')
          }
        })

        test(`${cmd} - no implicit wait`, async () => {
          await localRuntimeNoWait.run({
            type: cmd,
            selector: '#id',
          } as Command)
          expect(Util.waitForNode).not.toHaveBeenCalled()
          if (cmd.includes('mouse')) {
            expect(Util[cmd]).toHaveBeenCalledWith(client, '#id', 2)
          } else {
            expect(Util[cmd]).toHaveBeenCalledWith(client, '#id')
          }
        })

        test(`${cmd} - element does not exist`, async () => {
          let err
          try {
            await localRuntime.run({
              type: cmd,
              selector: '#missing',
            } as Command)
          } catch (e) {
            err = e
          }
          expect(err.message).toBe(`${cmd}(): node for selector #missing doesn't exist`)
          expect(Util.nodeExists).toHaveBeenCalledWith(client, '#missing')
        })
      })
    })

    describe('pdfs and screenshots uploaded to S3', () => {
      let writeFileSpy

      beforeEach(() => {
        writeFileSpy = jest.spyOn(require('fs'), 'writeFileSync')
          .mockReturnValue(undefined)
      })
      afterEach(() => {
        writeFileSpy.mockRestore()
        delete process.env['CHROMELESS_S3_BUCKET_NAME']
        delete process.env['CHROMELESS_S3_BUCKET_URL']
      })

      test('returnPdf to temp dir', async () => {
        const fileName = await localRuntime.run({
          type: 'returnPdf',
          options: {} as PdfOptions,
        })
        const expFilePath = path.join(os.tmpdir(), 'some-uid.pdf')
        expect(expFilePath).toBe(fileName)
        expect(writeFileSpy).toHaveBeenCalledWith(
          expFilePath,
          expect.any(Buffer)
        )
      })

      test('returnScreenshot to temp dir', async () => {
        const fileName = await localRuntime.run({
          type: 'returnScreenshot',
        })
        const expFilePath = path.join(os.tmpdir(), 'some-uid.png')
        expect(expFilePath).toBe(fileName)
        expect(writeFileSpy).toHaveBeenCalledWith(
          expFilePath,
          expect.any(Buffer)
        )
      })

      test('returnPdf upload to s3', async () => {
        process.env['CHROMELESS_S3_BUCKET_NAME'] = 'somebucket'
        process.env['CHROMELESS_S3_BUCKET_URL'] = 'some.amazone.url.com'
        const url = await localRuntime.run({
          type: 'returnPdf',
          options: {} as PdfOptions,
        })
        expect(Util.pdf).toHaveBeenCalledWith(client, {})
        expect(AWS.__mocks.putObject).toHaveBeenCalledWith({
          Bucket: 'somebucket',
          Key: 'some-uid.pdf',
          ContentType: 'application/pdf',
          ACL: 'public-read',
          Body: expect.any(Buffer),
        })
        expect(url).toBe('https://some.amazone.url.com/some-uid.pdf')
      })

      test('returnScreenshot upload to s3', async () => {
        process.env['CHROMELESS_S3_BUCKET_NAME'] = 'somebucket'
        process.env['CHROMELESS_S3_BUCKET_URL'] = 'some.amazone.url.com'
        const url = await localRuntime.run({
          type: 'returnScreenshot',
        })
        expect(Util.screenshot).toHaveBeenCalledWith(client)
        expect(AWS.__mocks.putObject).toHaveBeenCalledWith({
          Bucket: 'somebucket',
          Key: 'some-uid.png',
          ContentType: 'image/png',
          ACL: 'public-read',
          Body: expect.any(Buffer),
        })
        expect(url).toBe('https://some.amazone.url.com/some-uid.png')
      })
    })
  })
})