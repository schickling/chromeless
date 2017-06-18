import Chromeless from '../src'

async function run() {
  const chromeless = new Chromeless({runRemote: false, closeTab: false})

  chromeless
    .goto('https://www.google.com')
    .type('some text')
    .press(13)
    .wait(1000)
    .scrollTo(0, 1000)

  console.log(await chromeless.eval.screenshot())

  await chromeless.end()
}

run().catch(console.log.bind(console))
