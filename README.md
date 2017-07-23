# chromeless [![npm version](https://badge.fury.io/js/chromeless.svg)](https://badge.fury.io/js/chromeless)

Headless Chrome running on AWS Lambda (or locally)

[Demo Playground](https://chromeless-homepage.netlify.com/#src=const%20chromeless%20=%20new%20Chromeless(%7B%20remote:%20true%20%7D)%0A%0Aconst%20screenshot%20=%20await%20chromeless%0A%20%20.goto('https://www.graph.cool')%0A%20%20.scrollTo(0,%202000)%0A%20%20.screenshot()%0A%0Aconsole.log(screenshot)%0A%0Aawait%20chromeless.end())

## Installation
```sh
npm install chromeless
```

## Usage
```js
import Chromeless from 'chromeless'

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
```

### API

*TODO*

## Architecture

### Local execution

![](http://imgur.com/1eM8Bda.png)

### Remote execution

![](http://imgur.com/nYGKGpp.png)

## FAQ

### How is this different from [NightmareJS](https://github.com/segmentio/nightmare), Selenium or similar?

## Contributors

A big thank you to all contributors and supporters of this repository 💚 

<a href="https://github.com/adieuadieu/" target="_blank">
  <img src="https://github.com/adieuadieu?size=64" width="64" height="64" alt="adieuadieu">
</a>
<a href="https://github.com/schickling/" target="_blank">
  <img src="https://github.com/schickling.png?size=64" width="64" height="64" alt="schickling">
</a>
<a href="https://github.com/timsuchanek/" target="_blank">
  <img src="https://github.com/timsuchanek?size=64" width="64" height="64" alt="timsuchanek">
</a>
<a href="https://github.com/matthewmueller/" target="_blank">
  <img src="https://github.com/matthewmueller?size=64" width="64" height="64" alt="matthewmueller">
</a>


## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

![](http://i.imgur.com/5RHR6Ku.png)
