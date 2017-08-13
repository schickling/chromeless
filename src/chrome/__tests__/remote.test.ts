jest.useFakeTimers()
const got = require('got')
const mqtt = require('mqtt')
import { ChromelessOptions, Command, RemoteOptions } from '../../types'
import RemoteChrome from '../remote'

jest.mock('mqtt')
jest.mock('got')

describe('remote', () => {
  const originalConsoleLog = console.log
  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn
  beforeEach(() => {
    mqtt.__mock.channelId = 123
  })

  afterEach(() => {
    mqtt.__reset()
    console.log = originalConsoleLog
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
  })

  const remoteOpts: RemoteOptions = {
    endpointUrl: 'http://some.endoint.com',
    apiKey: 'some-api-key',
  }

  const chromeOpts: ChromelessOptions = {
    remote: remoteOpts,
  }

  test('connectinoPromise', async () => {
    const rc = new RemoteChrome(chromeOpts)
    const prom = rc['connectionPromise']
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 30000)

    await prom
    expect(mqtt.connect).toHaveBeenCalledWith('ws://blah.com', {
      will: {
        topic: 'chrome/last-will',
        payload: JSON.stringify({ channelId: 123 }),
        qos: 1,
        retain: false,
      }
    })
    expect(got).toHaveBeenCalledWith(remoteOpts.endpointUrl, {
      headers: { 'x-api-key': remoteOpts.apiKey },
      json: true,
    })
  })

  test('connectinoPromise timeout', async () => {
    mqtt.__mock.shouldConnect = false
    const rc = new RemoteChrome(chromeOpts)
    const prom = rc['connectionPromise']
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 30000)
    let err
    try {
      jest.runOnlyPendingTimers()
      await prom
    } catch (e) {
      err = e
    }
    // channel is not defined at the setTimeout scope at the time it's called for some reason
    expect(rc['channel'].end).not.toHaveBeenCalled()
    expect(err.message).toBe('Timed out after 30sec. Connection couldn\'t be established.')
  })

  test('with debug', async () => {
    console.log = jest.fn()
    const rc = new RemoteChrome(Object.assign({ debug: true }, chromeOpts))
    await rc['connectionPromise']
    const channel = rc['channel']
    expect(console.log).toHaveBeenCalledWith('Connected to message broker.')
    expect(channel.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(channel.on).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  test('catches a got exception', async () => {
    console.error = jest.fn()
    got.mockImplementationOnce(() => {
      return Promise.reject(new Error('bad request or whatever'))
    })
    const rc = new RemoteChrome(Object.assign({ debug: true }, chromeOpts))
    let err
    try {
      await rc['connectionPromise']
    } catch (e) {
      err = e
    }
    expect(console.error).toHaveBeenCalledWith(expect.any(Error))
    expect(err.message).toBe('Unable to get presigned websocket URL and connect to it.')
  })

  describe('onMessage TOPIC_END', () => {
    let topicEnd
    beforeEach(() => {
      topicEnd = `chrome/${mqtt.__mock.channelId}/end`
    })

    test('out of time', async () => {
      console.warn = jest.fn()
      const rc = new RemoteChrome(chromeOpts)
      await rc['connectionPromise']

      await rc.onMessage(topicEnd, new Buffer(JSON.stringify({
        outOfTime: true,
      })))
      expect(console.warn)
        .toHaveBeenCalledWith(`Chromeless Proxy disconnected because it reached it's execution time limit (5 minutes).`)
      expect(rc['channel'].end).toHaveBeenCalledTimes(1)
      expect(rc['channel'].publish).toHaveBeenCalledWith(topicEnd, JSON.stringify({ channelId: 123, client: true}))
    })

    test('inactivity', async () => {
      console.warn = jest.fn()
      const rc = new RemoteChrome(chromeOpts)
      await rc['connectionPromise']
      await rc.onMessage(topicEnd, new Buffer(JSON.stringify({
        inactivity: true,
      })))
      expect(console.warn)
        .toHaveBeenCalledWith('Chromeless Proxy disconnected due to inactivity (no commands sent for 30 seconds).')
    })

    test('unknown', async () => {
      console.warn = jest.fn()
      const rc = new RemoteChrome(chromeOpts)
      await rc['connectionPromise']
      const data = { some: 'data' }
      await rc.onMessage(topicEnd, new Buffer(JSON.stringify(data)))
      expect(console.warn)
        .toHaveBeenCalledWith(`Chromeless Proxy disconnected (we don't know why).`, data)
    })
  })

  describe('process()', () => {
    let topicResponse
    beforeEach(() => {
      topicResponse = `chrome/${mqtt.__mock.channelId}/response`
    })

    test('resolves command result', async () => {
      console.log = jest.fn()
      const rc = new RemoteChrome(Object.assign({ debug: true }, chromeOpts))
      const cmd = { type: 'clearCache' } as Command
      await rc.process(cmd)
      expect(console.log).toHaveBeenCalledWith(`Running remotely: ${JSON.stringify(cmd)}`)
      const channel = rc['channel']
      expect(channel.subscribe).toHaveBeenCalledWith(topicResponse, expect.any(Function))
    })

    test('resolves command result value', async () => {
      console.log = jest.fn()
      const rc = new RemoteChrome(chromeOpts)
      const cmd = { type: 'returnHtml' } as Command
      const result = await rc.process(cmd)
      expect(result).toEqual('<div>html</div>')
    })

    test('resolves command result value', async () => {
      console.log = jest.fn()
      const rc = new RemoteChrome(chromeOpts)
      const cmd = { type: 'returnScreenshot' } as Command
      let err
      try {
        await rc.process(cmd)
      } catch (e) {
        err = e
      }
      expect(err).toBe('something went wrong')
    })
  })
})
