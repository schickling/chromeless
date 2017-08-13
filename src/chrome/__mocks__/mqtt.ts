const chalk = require('chalk')
const log = console.log

export const __mock = {
  channelId: null,
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
      log(chalk[color](`${key}() @ ${this.incr(key)}:\n${JSON.stringify(args, null, 2)}`))
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

  return {
    subscribe: jest.fn((event, opts, callback) => {
      if (typeof opts === 'function') {
        callback = opts
        opts = null
      }

      counters.factory('subscribe')(opts)
      if (typeof callback !== 'function') {
        throw new Error('We need a callback.')
      }
      subscriberAdd(event, callback)
      if (event === this.TOPIC_CONNECTED) {
        return callback()
      } else if (event === this.TOPIC_END) {
        return callback()
      } else if (event === this.TOPIC_RESPONSE) {
        return callback()
      }
      throw new Error(`Unknown topic: ${event}\n\s\s${JSON.stringify(this, null, 2)}`)
    }),
    on: jest.fn((event, callback) => {
      counters.factory('on')(event)
      if (event === 'connect') {
        callback()
      }

      if (event === 'message') {
        callback(this.TOPIC_CONNECTED)
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
    }),
    end: jest.fn(() => {
      counters.factory('end')(event)
    })
  }
})

export type MqttClient = {}
