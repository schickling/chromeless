export async function nodeAppears(client, selector) {
  // browser code to register and parse mutations
  const browserCode = (selector) => {
    return new Promise((fulfill, reject) => {
      new MutationObserver((mutations, observer) => {
        // add all the new nodes
        const nodes = []
        mutations.forEach((mutation) => {
          nodes.push(...mutation.addedNodes)
        })
        // fulfills if at least one node matches the selector
        if (nodes.find((node) => node.matches(selector))) {
          observer.disconnect()
          fulfill()
        }
      }).observe(document.body, {
        childList: true
      })
    })
  }
  // inject the browser code
  const {Runtime} = client
  await Runtime.evaluate({
    expression: `(${browserCode})(\`${selector}\`)`,
    awaitPromise: true
  })
}

export async function waitForNode(client, selector) {
  const {Runtime} = client
  const getNode = (selector) => {
    return document.querySelector(selector)
  }

  const result = await Runtime.evaluate({
    expression: `(${getNode})(\`${selector}\`)`,
  })

  if (result.result.value === null) {
    await nodeAppears(client, selector)
  }
}

export async function wait(timeout: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

export async function nodeExists(client, selector) {
  const {Runtime} = client
  const exists = (selector) => {
    return document.querySelector(selector)
  }

  const expression = `(${exists})(\`${selector}\`)`

  try {
    const result = await Runtime.evaluate({
      expression,
    })

    // counter intuitive: if it is a real object and not just null,
    // the chrome debugger won't return a value but return a objectId
    const exists = typeof result.result.value === 'undefined'
    return exists
  } catch (e) {
    console.error('Error while trying to run nodeExists')
    console.error(e)
  }
}

export async function getPosition(client, selector) {

  const {Runtime} = client

  const getTop = (selector) => {
    return document.querySelector(selector).getBoundingClientRect().top
  }
  const getLeft = (selector) => {
    return document.querySelector(selector).getBoundingClientRect().left
  }

  const topExpression = `(${getTop})(\`${selector}\`)`
  const topResult = await Runtime.evaluate({
    expression: topExpression,
  })

  const leftExpression = `(${getLeft})(\`${selector}\`)`
  const leftResult = await Runtime.evaluate({
    expression: leftExpression,
  })

  const x = parseInt(leftResult.result.value, 10)
  const y = parseInt(topResult.result.value, 10)

  if (isNaN(x) || isNaN(y)) {
    throw new Error(`The viewport position for ${selector} couldn't be determined. x: ${x} y: ${y}`)
  }

  return {
    x: x,
    y: y,
  }
}

export async function click(client, useArtificialClick, selector) {
  if (useArtificialClick) {
    console.log('Using artificial .click()')
    const {Runtime} = client
    const click = (selector) => {
      return document.querySelector(selector).click()
    }
    const expression = `(${click})(\`${selector}\`)`

    await Runtime.evaluate({
      expression,
    })
  } else {
    const position = await getPosition(client, selector)
    const {Input} = client

    const options = {
      x: position.x + 1,
      y: position.y + 1,
      button: 'left',
      clickCount: 1
    }

    await Input.dispatchMouseEvent({
      ...options,
      type: 'mousePressed'
    })
    await Input.dispatchMouseEvent({
      ...options,
      type: 'mouseReleased'
    })
  }
}

export async function focus(client, selector) {
  const {Runtime} = client
  const focus = (selector) => {
    return document.querySelector(selector).focus()
  }
  const expression = `(${focus})(\`${selector}\`)`

  await Runtime.evaluate({
    expression,
  })
}

export async function evaluate(client, fn) {
  const {Runtime} = client
  const expression = `(${fn})()`

  return await Runtime.evaluate({
    expression,
  }).result.value
}

export async function type(client, useArtificialClick, text, selector) {
  if (selector) {
    await click(client, useArtificialClick, selector)
    await wait(500)
  }

  const {Input} = client

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    // Array.prototype.forEach.call(text, async (char) => {
    const options = {
      type: 'char',
      text: char,
      unmodifiedText: char,
    }
    const res = await Input.dispatchKeyEvent(options)
  }
}

export async function backspace(client, useArtificialClick, n, selector) {
  if (selector) {
    await click(client, useArtificialClick, selector)
    await wait(500)
  }

  const {Input} = client

  for (let i = 0; i < n; i++) {
    const options = {
      modifiers: 8,
      key: 'Backspace',
      code: 'Backspace',
      nativeVirtualKeyCode: 8,
      windowsVirtualKeyCode: 8,
    }
    await Input.dispatchKeyEvent({
      ...options,
      type: 'rawKeyDown',
    })
    await Input.dispatchKeyEvent({
      ...options,
      type: 'keyUp',
    })

    console.log('sent backspace', options)
  }
  const options = {
    type: 'rawKeyDown',
    nativeVirtualKeyCode: 46,
  }
  const res = await Input.dispatchKeyEvent(options)
}

export async function getValue(client, selector) {
  const {Runtime} = client
  const browserCode = (selector) => {
    return document.querySelector(selector).value
  }
  // console.log('getting value for', selector)
  const expression = `(${browserCode})(\`${selector}\`)`
  try {
    const result = await Runtime.evaluate({
      expression,
    })
    return result.result.value
  } catch (e) {
    console.error(e)
  }
}
