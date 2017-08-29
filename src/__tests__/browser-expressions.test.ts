import { BROWSER_EXPRESSIONS, getClientRect } from '../browser-expressions'
import { resolveValue } from '../../utils/test_helper'

test('window.innerHeight', () => {
  expect(BROWSER_EXPRESSIONS.window.innerHeight).toBe(
    `
function () {
  return window.innerHeight;
}
  `.trim(),
  )
})

test('window.innerWidth', () => {
  expect(BROWSER_EXPRESSIONS.window.innerWidth).toBe(
    `
function () {
  return window.innerWidth;
}
  `.trim(),
  )
})

test('document.querySelector', () => {
  expect(BROWSER_EXPRESSIONS.document.querySelector).toBe(
    `
function (selector) {
  return document.querySelector(selector);
}
  `.trim(),
  )
})

test('location.href', () => {
  expect(BROWSER_EXPRESSIONS.location.href).toBe(
    `
function () {
  return location.href;
}
  `.trim(),
  )
})

test('element.exists', () => {
  expect(BROWSER_EXPRESSIONS.element.exists).toBe(
    `
function (selector) {
  return !!document.querySelector(selector);
}
  `.trim(),
  )
})

test('element.value', () => {
  expect(BROWSER_EXPRESSIONS.element.value).toBe(
    `
function (selector) {
  return (document.querySelector(selector) || {}).value;
}
  `.trim(),
  )
})

test('getClientRect', async () => {
  const c = {
    Runtime: {
      evaluate: jest.fn(() =>
        Promise.resolve({
          result: {
            value: 1,
          },
        }),
      ),
    },
  }

  expect(await getClientRect(c, '#iidd')).toBe(1)
})

test('getClientRect exception', async () => {
  const c = {
    Runtime: {
      evaluate: jest.fn(
        resolveValue({
          result: { value: null },
        }),
      ),
    },
  }

  const selector = '#idddddd'
  let err
  try {
    await getClientRect(c, selector)
  } catch (e) {
    err = e
  }
  expect(c.Runtime.evaluate).toHaveBeenCalledWith({
    expression: `(${BROWSER_EXPRESSIONS.client.coordinates})(\`${selector}\`)`,
  })
  expect(err.message).toMatch(/No element found/)
})
