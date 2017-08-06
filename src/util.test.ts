import * as fs from 'fs'
import * as os from 'os'
import * as CDP from 'chrome-remote-interface'
import test from 'ava'
import Chromeless from '../src'

const getPngMetaData = async (filePath): Promise<any> => {
  const fd = fs.openSync(filePath, 'r')
  return await new Promise((resolve) => {
    fs.read(fd, Buffer.alloc(24), 0, 24, 0,
     (err, bytesRead, buffer) => resolve({
       width: buffer.readUInt32BE(16),
       height: buffer.readUInt32BE(20)
     }))
  })
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

  const regex = new RegExp(os.tmpdir().replace(/\\/g, '\\\\'))

  t.regex(screenshot, regex)
  t.regex(pdf, regex)
})

test('screenshot by selector', async t => {
    const version = await CDP.Version()
    const versionMajor = parseInt(/\/(\d+)/.exec(version['User-Agent'])[1])
    // clipping will only work on chrome 62+

    const chromeless = new Chromeless({ launchChrome: false })
    const screenshot = await chromeless
        .goto('http://localhost:9999')
        .screenshot('img')

    await chromeless.end()

    const png = await getPngMetaData(screenshot)
    t.is(png.width, versionMajor > 61 ? 512 : 1440)
    t.is(png.height, versionMajor > 61 ? 512 : 900)
})
