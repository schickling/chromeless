jest.useFakeTimers()
jest.mock('got')
const got = require('got')
jest.mock('mqtt')
const mqtt = require('mqtt')
mqtt.__mock.channelId = 123
import { ChromelessOptions, RemoteOptions } from '../../types'
import RemoteChrome from '../remote'

describe('remote', () => {
  const remoteOpts: RemoteOptions = {
    endpointUrl: 'http://some.endoint.com',
    apiKey: 'some-api-key',
  }

  const chromeOpts: ChromelessOptions = {
    remote: remoteOpts,
  }

  test('constructor', async () => {
    const rc = new RemoteChrome(chromeOpts)
    const prom = rc.process({ type: 'clearCache' })
    expect(setTimeout).toHaveBeenCalled()
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
})