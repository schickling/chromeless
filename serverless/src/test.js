const Chromeless = require('chromeless').default

async function run() {
  const chromeless = new Chromeless({
    remote: { endpoint: 'https://285elhm6ce.execute-api.eu-west-1.amazonaws.com/dev/session' },
    debug: true,
  })

  const screenshot = await chromeless
    .goto('https://www.google.com')
    .type('chromeless', 'input[name="q"]')
    .press(13)
    .wait('#resultStats')
    .screenshot()
    .scrollTo(0, 1000)

  console.log(screenshot) // prints local file path or S3 url


  await chromeless.end()
}

run().catch(console.error.bind(console))
