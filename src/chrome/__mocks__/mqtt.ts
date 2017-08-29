const chalk = require('chalk')
const log = console.log.bind(console)

export let __mock = {
  channelId: null,
  verbose: false,
  shouldConnect: true,
}
const origMock = Object.assign({}, __mock);

export function __reset() {
  __mock = Object.assign({}, origMock)
}

const colormap = {
  subscribe: 'blueBright',
  on: 'green',
  publish: 'yellow',
  end: 'red'
}

const counters = {
  incr: function (key) {
    this[key] = (this[key] || 0) + 1
    return this[key]
  },
  factory: function (key) {
    const color = colormap[key] || chalk.bold.red
    return (...args) => {
      if (__mock.verbose) {
        log(chalk[color](`${key}() @ ${this.incr(key)}:\n${JSON.stringify(args, null, 2)}`))
      }
    }
  }
}

export const connect = jest.fn(function () {
  this.TOPIC_NEW_SESSION = 'chrome/new-session'
  this.TOPIC_CONNECTED = `chrome/${__mock.channelId}/connected`
  this.TOPIC_REQUEST = `chrome/${__mock.channelId}/request`
  this.TOPIC_RESPONSE = `chrome/${__mock.channelId}/response`
  this.TOPIC_END = `chrome/${__mock.channelId}/end`

  const subscribers: Map<string, Set<Function>> = new Map()
  const subscriberAdd = (topic: string, fn: Function) => {
    const now = subscribers.get(topic) || new Set()
    now.add(fn)
    subscribers.set(topic, now)
  }

  const onMessagesCallbacks = new Set()

  return {
    subscribe: jest.fn((topic, opts, callback) => {
      if (typeof opts === 'function') {
        callback = opts
        opts = null
      }

      counters.factory('subscribe')(opts)
      if (typeof callback !== 'function') {
        callback = function () {}
      }
      subscriberAdd(topic, callback)
      if (topic === this.TOPIC_CONNECTED) {
        return callback()
      } else if (topic === this.TOPIC_END) {
        return callback()
      } else if (topic === this.TOPIC_RESPONSE) {
        return callback()
      }
      throw new Error(`Unknown topic: ${topic}\n\s\s${JSON.stringify(this, null, 2)}`)
    }),
    on: jest.fn((event, callback) => {
      counters.factory('on')(event)
      if (event === 'connect' && __mock.shouldConnect) {
        callback()
      } else {
        onMessagesCallbacks.add(callback)
      }
    }),
    publish: jest.fn((...args) => {
      const [
        topic,
        payload,
      ] = args
      counters.factory('publish')({ topic, payload })

      const subs = subscribers.get(topic) || new Set([])
      counters.factory('publish')(`Subscribers: ${subs.size}`)
      subs.forEach(fn => {
        return fn()
      })

      onMessagesCallbacks.forEach(fn => {
        if (topic === this.TOPIC_NEW_SESSION && __mock.shouldConnect) {
          fn(this.TOPIC_CONNECTED)
        }

        if (topic === this.TOPIC_REQUEST) {
          const cmd = JSON.parse(payload)
          const result: any = {}
          if (cmd.type === 'returnHtml') {
            result.value = '<div>html</div>'
          }

          if (cmd.type === 'returnScreenshot') {
            result.error = 'something went wrong'
          }
          const buf = new Buffer(JSON.stringify(result))
          fn(this.TOPIC_RESPONSE, buf)
        }
      })
    }),
    end: jest.fn(() => {
      counters.factory('end')()
    })
  }
})

export type MqttClient = {}
