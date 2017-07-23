import Chromeless from '../src'

async function run() {
  const chromeless = new Chromeless()

  const screenshot = await chromeless
    .goto('https://www.google.com')
    .type('chromeless', 'input[name="q"]')
    .press(13)
    .wait('#resultStats')
    .screenshot()
    .scrollTo(0, 1000)

  console.log(screenshot)

  await chromeless.end()
}

run().catch(console.error.bind(console))