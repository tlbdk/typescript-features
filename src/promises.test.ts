import { AsyncPromise } from './async-promise'

async function throwAsync(e: Error): Promise<void> {
  return new Promise((resolve, reject) => {
    reject(e)
  })
}

describe('Promises', () => {
  test('Exceptions will be converted to rejects', async () => {
    const promise = new Promise<boolean>(() => {
      throw new Error('Hello')
    })
    await expect(promise).rejects.toThrow(new Error('Hello'))
  })

  test('Exceptions can be converted to rejects only when a try/catch is used', async () => {
    // When using async the whole block is converted to Promise that is returned to the caller
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<boolean>(async (resolve, reject) => {
      try {
        throw new Error('Hello') // This means that this won't be caught unless we do the try catch here
      } catch (e) {
        reject(e)
      }
      resolve()
    })
    await expect(promise).rejects.toThrow(new Error('Hello'))
  })

  test('Same issue with a function returning an promise that throws when calling await', async () => {
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<boolean>(async (_, reject) => {
      try {
        await throwAsync(new Error('Hello'))
      } catch (e) {
        reject(e)
      }
    })
    await expect(promise).rejects.toThrow(new Error('Hello'))
  })

  test('AsyncPromise handles async Promise executer body', async () => {
    const promise = new AsyncPromise<boolean>(async () => {
      await throwAsync(new Error('Hello'))
    })
    await expect(promise).rejects.toThrow(new Error('Hello'))
  })
})
