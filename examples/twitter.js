const { Chromeless } = require('chromeless')

const twitterUsername = "xxx"
const twitterPassword = "xxx"

async function run() {
  const chromeless = new Chromeless()

  const screenshot = await chromeless
    .goto('https://twitter.com/login/')
    .type(twitterUsername, '.js-username-field')
    .type(twitterPassword, '.js-password-field')
    .click('button[type="submit"]')
    .wait('.status')
    .screenshot()

  await chromeless.end()
}

run().catch(console.error.bind(console))

