# chromeless

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
