# chromeless

[Demo Playground](https://chromeless-homepage.netlify.com/#src=const%20chromeless%20=%20new%20Chromeless(%7B%20remote:%20true%20%7D)%0A%0Aconst%20screenshot%20=%20await%20chromeless%0A%20%20.goto('https://www.graph.cool')%0A%20%20.scrollTo(0,%202000)%0A%20%20.screenshot()%0A%0Aconsole.log(screenshot)%0A%0Aawait%20chromeless.end())

## Installation
```sh
npm install chromeless
```

## Usage
```js
import Chromeless from 'chromeless'

const chromeless = new Chromeless()

chromeless
    .goto('https://console.graph.cool/signup')
    .type('#email', 'test@account.com')
    .type('#password', 'secret password')
    .click('submit')
    .wait('.graphcool-console')
    
const title = await chromeless.evaluate(() => document.querySelector('.title').text)
    
await chromeless.end()
```

## Architecture

### Local execution

![](http://imgur.com/HGQAIoz.png)

### Remote execution

![](http://imgur.com/zFLQ0Lf.png)
