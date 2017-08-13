/**
 * Wanted to have a consistent launcher for tests
 */

const unhandledRejection = require('unhandled-rejection')
const chalk = require('chalk')
const { launch } = require('chrome-launcher')
const { defaultLaunchConfig } = require('./test_helper')

const rejectionEmitter = unhandledRejection({
  timeout: 20
})

rejectionEmitter.on('unhandledRejection', (error, promise) => {
  console.log('Promise:', promise)
  throw error
})

rejectionEmitter.on('rejectionHandled', (error, promise) => {
  console.error(error, promise)
})

const launcher = async (opts = defaultLaunchConfig.cdp) => {
  const mergedOpts = Object.assign({},
    {
      // (optional) remote debugging port number to use. If provided port is already busy, launch() will reject
      // Default: an available port is autoselected
      port: undefined,

      // (optional) Additional flags to pass to Chrome, for example: ['--headless', '--disable-gpu']
      // See all flags here: http://peter.sh/experiments/chromium-command-line-switches/
      // Do note, many flags are set by default: https://github.com/GoogleChrome/lighthouse/blob/master/chrome-launcher/flags.ts
      chromeFlags: [
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--disable-translate',
        '--disable-background-timer-throttling',
      ],

      // (optional) Close the Chrome process on `Ctrl-C`
      // Default: true
      handleSIGINT: true,

      // (optional) Explicit path of intended Chrome binary
      // If the `CHROME_PATH` env variable is set, that will be used
      // Usage of `LIGHTHOUSE_CHROMIUM_PATH` env variable is deprecated
      // By default, any detected Chrome Canary or Chrome (stable) will be launched
      chromePath: undefined,

      // (optional) Chrome profile path to use
      // By default, a fresh Chrome profile will be created
      userDataDir: undefined,

      // (optional) Starting URL to open the browser with
      // Default: `about:blank`
      startingUrl: undefined,

      // (optional) Logging level: verbose, info, error, silent
      // Default: 'info'
      logLevel: 'info',

      // (optional) Enable extension loading
      // Default: false
      enableExtensions: false,
    },
    opts)

  return launch(mergedOpts)
}

module.exports.launcher = launcher

if (module === require.main) {
  (async () => {
    const chrome = await launcher()
    console.log(chalk.bold.green(`Chrome running: ${JSON.stringify(chrome)}`))
    return chrome
  })()
}

