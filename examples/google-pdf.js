const { Chromeless } = require('chromeless')

async function run() {
  const chromeless = new Chromeless()

  const pdf = await chromeless
    .goto('https://www.google.com')
    .type('chromeless', 'input[name="q"]')
    .press(13)
    .wait('#resultStats')
    .pdf({ displayHeaderFooter: true, landscape: true })

  console.log(pdf) // prints local file path or S3 url

  await chromeless.end()
}

run().catch(console.error.bind(console))
