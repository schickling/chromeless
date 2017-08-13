// I moved this to constants in the hopes of better unit testing,
// but still exprimenting with it. The problem is that TypeScript compiles,
// and then jest adds istanbul comments
const _getClientRectJs = `
   function (selector) {
    var element = document.querySelector(selector)
    if (!element) {
      return undefined
    }

    var rect = element.getBoundingClientRect()
    return JSON.stringify({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      height: rect.height,
      width: rect.width,
    })
  }
  `.trim()

export const BROWSER_EXPRESSIONS = {
  window: {
    innerHeight: `
function () {
  return window.innerHeight;
}
      `.trim(),
    innerWidth: `
function () {
  return window.innerWidth;
}
      `.trim(),
    scrollTo: `
function (x, y) {
  return window.scrollTo(x, y);
}
      `.trim(),
  },
  document: {
    querySelector: `
function (selector) {
  return document.querySelector(selector);
}
      `.trim(),
  },
  location: {
    href: `
function () {
  return location.href;
}
      `.trim(),
  },
  element: {
    exists: `
function (selector) {
  return !!document.querySelector(selector);
}
      `.trim(),
    value: `
function (selector) {
  return (document.querySelector(selector) || {}).value;
}
      `.trim(),
  },
  client: {
    coordinates: _getClientRectJs,
  },
}

export async function getClientRect(client, selector): Promise<ClientRect> {
  const { Runtime } = client

  const expression = `(${BROWSER_EXPRESSIONS.client
    .coordinates})(\`${selector}\`)`
  const result = await Runtime.evaluate({ expression })

  if (!result.result.value) {
    throw new Error(`No element found for selector: ${selector}`)
  }

  return JSON.parse(result.result.value) as ClientRect
}
