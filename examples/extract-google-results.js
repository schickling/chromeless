const { Chromeless } = require('chromeless')

async function run() {
  const chromeless = new Chromeless({ remote: true })

  const links = await chromeless
    .goto('https://www.google.com')
    .type('chromeless', 'input[name="q"]')
    .press(13)
    .wait('#resultStats')
    .evaluate(() => {
      // this will be executed in headless chrome
      const links = [].map.call(
        document.querySelectorAll('.g h3 a'),
        a => ({title: a.innerText, href: a.href})
      )
      return JSON.stringify(links)
    })
    // you can still use the method chaining API after evaluating
    // when you're done, at any time you can call `.then` (in our case `await`)
    .scrollTo(0, 1000)

  console.log(links)

  await chromeless.end()
}

run().catch(console.error.bind(console))
