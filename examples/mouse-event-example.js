const { Chromeless } = require('chromeless')

async function run() {
    const chromeless = new Chromeless()

    const screenshot = await chromeless
        .goto('https://blueimp.github.io/jQuery-File-Upload/')
        .selectFile('input[type="file"]', '/Users/admir/Downloads/thumbnail_datetime.jpg')
        .wait('.latest-doodle')
        .screenshot()

    console.log(screenshot)

    await chromeless.end()
}

run().catch(console.error.bind(console))
