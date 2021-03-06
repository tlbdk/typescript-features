import { TimeoutPromise, TimeoutError } from './timeout-promise'

describe('TimeoutPromise', () => {
  test('Simple timeout', async () => {
    const promise = new TimeoutPromise<boolean>(() => {
      // Do nothing
    }, 1)
    await expect(promise).rejects.toEqual(new TimeoutError())
  })
})
