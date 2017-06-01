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
    .evaluate(() => {
        return document.querySelector('.title').text;
    })
    .end()
    .then((title) => {
        console.log('title', title)
    })
    .catch((error) => {
        console.error('test failed', error)
    })
```