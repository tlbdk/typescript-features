import { DeferredPromise } from './deferred-promise'

describe('DeferredPromise', () => {
  test('Simple timeout', async () => {
    const promise = new DeferredPromise<boolean>(() => {
      // Do nothing
    })
    promise.resolve(true)
    await expect(promise).resolves.toEqual(true)
  })
})
