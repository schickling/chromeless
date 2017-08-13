import Queue from '../queue'
import { Chrome } from '../types'
import { resolveValue } from '../../utils/test_helper'

test('process with lastWaitAll', async () => {
  const c = {
    // just need a slight async in order to get .lastWaitAll to be set
    process: jest.fn(() => new Promise(resolve => setTimeout(resolve, 10))),
    close: jest.fn(resolveValue()),
  } as Chrome

  const q = new Queue(c)
  q.enqueue({ type: 'clearCache' })
  q.process({ type: 'clearCache' })
  await q.process({ type: 'clearCache' })
  expect(c.process).toHaveBeenCalledTimes(3)
})
