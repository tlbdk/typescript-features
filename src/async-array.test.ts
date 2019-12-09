import { AsyncArray } from './async-array'

describe('AsyncArray', () => {
  it('should iterate of array of promises with error', async () => {
    const array = new AsyncArray<Promise<number>>(
      Promise.resolve(1),
      Promise.resolve(2),
      // Make sure we go to next tick
      new Promise(resolve =>
        setTimeout(() => {
          resolve(3)
        }, 1)
      ),
      Promise.reject(new Error('4'))
    )

    let error = null
    let count = 0
    try {
      for await (const item of array) {
        count++
      }
    } catch (e) {
      error = e
    }
    expect(count).toEqual(3)
    expect(error).toEqual(new Error('4'))
  })
})
