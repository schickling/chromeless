const { Chromeless } = require('chromeless')

async function run() {
  const chromeless = new Chromeless({ remote: true })

  const twitterUsername = "xxx"
  const twitterPassword = "xxx"

  // Login
  const screenshot = await chromeless
    .goto('https://twitter.com/login/')
    .type(twitterUsername, '.js-username-field')
    .type(twitterPassword, '.js-password-field')
    .click('button[type="submit"]')
    .wait('.settings')
    .screenshot()

  console.log(screenshot)

  await chromeless.end()
}

run().catch(console.error.bind(console))
