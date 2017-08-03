const { Chromeless } = require('chromeless')
const { expect } = require('chai')

// make sure you do npm i chai
// to run this example just run
// mocha path/to/this/file

describe('When searching on google', function () {
  it('shows results', async function () {
    this.timeout(10000); //we need to increase the timeout or else mocha will exit with an error
    const chromeless = new Chromeless()

    await chromeless.goto('https://google.com')
      .wait('input[name="q"]')
      .type('chromeless github', 'input[name="q"]')
      .press(13) // press enter
      .wait('#resultStats')


    const result = await chromeless.exists('a[href*="graphcool/chromeless"]')


    expect(result).to.be.true
    await chromeless.end()
  })
})

describe('When clicking on the image of the demo playground', function () {
  it('should redirect to the demo', async function () {
    this.timeout(10000); //we need to increase the timeout or else mocha will exit with an error
    const chromeless = new Chromeless()
    await chromeless.goto('https://github.com/graphcool/chromeless')
      .wait('a[href="https://chromeless.netlify.com/"]')
      .click('a[href="https://chromeless.netlify.com/"]')
      .wait('#root')


    const url = awaitchromeless.evaluate(url => window.location.href)


    expect(url).to.match(/^https\:\/\/chromeless\.netlify\.com/)
    await chromeless.end()
  })
})
