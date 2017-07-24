const Chromeless = require('chromeless').default

async function run() {
  const chromeless = new Chromeless({
    remote: { endpoint: 'https://285elhm6ce.execute-api.eu-west-1.amazonaws.com/dev/session' }
  })

  const screenshot = await chromeless
    .goto('https://www.google.com')
    .type('chromeless', 'input[name="q"]')
    .press(13)
    .wait('#resultStats')
    .scrollTo(0, 1000)

  await chromeless.end()
}

run().catch(console.error.bind(console))
