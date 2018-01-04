const Chromeless = require('chromeless').default

process.on('unhandledRejection', console.warn)
process.on('uncaughtException', console.error)

if (typeof process.env.CHROMELESS_ENDPOINT_URL === 'undefined') {
  console.error('CHROMELESS_ENDPOINT_URL is unset. Please set it.')
  process.exit()
}

if (typeof process.env.CHROMELESS_ENDPOINT_API_KEY === 'undefined') {
  console.error('CHROMELESS_ENDPOINT_API_KEY is unset. Please set it.')
  process.exit()
}

async function run() {
  const chromeless = new Chromeless({
    remote: {
      endpointUrl: process.env.CHROMELESS_ENDPOINT_URL,
      apiKey: process.env.CHROMELESS_ENDPOINT_API_KEY,
    },
  })

  const versionInfo = await chromeless.evaluate(() => {
    // this will be executed in Chrome
    return window.navigator.userAgent
  })

  console.log('\nUser-Agent:', versionInfo, '\n')

  const screenshot = await chromeless
    .goto('https://www.google.com')
    .type('chromeless', 'input[name="q"]')
    .press(13)
    .wait('#resultStats')
    .screenshot()

  console.log(screenshot) // prints local file path or S3 url

  await chromeless.end()
}

run().catch(console.error)
