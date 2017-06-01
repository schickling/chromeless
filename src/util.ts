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
    expression: `(${browserCode})(${JSON.stringify(selector)})`,
    awaitPromise: true
  })
}

export async function waitForNode(client, selector) {
  const {Runtime} = client
  const getNode = (selector) => {
    return document.querySelector(selector)
  }

  const result = await Runtime.evaluate({
    expression: `(${getNode})(${JSON.stringify(selector)})`,
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

export async function getPosition(client, selector) {

  const {Runtime} = client

  const getTop = (selector) => {
    return document.querySelector(selector).getBoundingClientRect().top
  }
  const getLeft = (selector) => {
    return document.querySelector(selector).getBoundingClientRect().left
  }

  const topResult = await Runtime.evaluate({
    expression: `(${getTop})(${JSON.stringify(selector)})`,
  })

  const leftResult = await Runtime.evaluate({
    expression: `(${getLeft})(${JSON.stringify(selector)})`,
  })

  const x = leftResult.result.value
  const y = topResult.result.value
  return {
    x, y,
  }
}

export async function click(client, selector) {
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

export async function focus(client, selector) {
  const {Runtime} = client
  const focus = (selector) => {
    return document.querySelector(selector).focus()
  }
  const expression = `(${focus})(${JSON.stringify(selector)})`

  await Runtime.evaluate({
    expression,
  })
}

export async function type(client, selector, text) {
  await click(client, selector)
  const {Input} = client

  await wait(500)

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
  // Array.prototype.forEach.call(text, async (char) => {
    const options = {
      type: 'char',
      text: char,
      unmodifiedText: char,
    }
    const res = await Input.dispatchKeyEvent(options)
  // })
  }
}

export async function getValue(client, selector) {
  const {Runtime} = client
  const browserCode = (selector) => {
    return document.querySelector(selector).value
  }
  // console.log('getting value for', selector)
  const expression = `(${browserCode})(${JSON.stringify(selector)})`
  try {
    const result = await Runtime.evaluate({
      expression,
    })
    return result.result.value
  } catch (e) {
    console.error(e)
  }
}
