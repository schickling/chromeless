import * as fs from 'fs'
import * as os from 'os'
import * as util from 'util'
import test from 'ava'
import Chromeless from '../src'

const readAsync = util.promisify(fs.read)
const getPngMetaData = async filePath => {
  const fd = fs.openSync(filePath, 'r')
  const { buffer } = await readAsync(fd, Buffer.alloc(24), 0, 24, 0)
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}


// POC
test('google title', async t => {
  const chromeless = new Chromeless({ launchChrome: false })
  const title = await chromeless
    .goto('http://localhost:9999')
    .evaluate(() => document.title)

  await chromeless.end()

  t.is(title, 'Chromeless test page')
})

test('screenshot and pdf path', async t => {
  const chromeless = new Chromeless({ launchChrome: false })
  const screenshot = await chromeless
    .goto('http://localhost:9999')
    .screenshot()
  const pdf = await chromeless
    .goto('http://localhost:9999')
    .pdf()

  await chromeless.end()

  if (os.platform() === 'win32') {
    t.regex(screenshot, /\\/)
    t.regex(pdf, /\\/)
  } else {
    t.regex(screenshot, /tmp/)
    t.regex(pdf, /tmp/)
  }
})

test('screenshot by selector', async t => {
    const chromeless = new Chromeless({ launchChrome: false })
    const screenshot = await chromeless
        .goto('http://localhost:9999')
        .screenshot('img')

    await chromeless.end()

    const png = await getPngMetaData(screenshot)
    t.is(png.width, 512)
    t.is(png.height, 512)
})
