# chromeless

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

## Architecture

### Local execution

![](http://imgur.com/1eM8Bda.png)

### Remote execution

![](http://imgur.com/nYGKGpp.png)
