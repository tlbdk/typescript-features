import { AsyncArray, AsyncOrderedArray } from './async-array'

describe('AsyncArray', () => {
  it('should iterate over array of promises with error', async () => {
    const array = new AsyncArray(
      0,
      Promise.resolve(1),
      Promise.resolve(2),
      // Make sure we go to next tick
      new Promise(resolve => setTimeout(resolve, 1, 3)),
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
    expect(count).toEqual(4)
    expect(error).toEqual(new Error('4'))
  })

  it('should return items in order', async () => {
    const array = new AsyncOrderedArray(
      Promise.resolve(1),
      0,
      new Promise(resolve => setTimeout(resolve, 30, 4)),
      new Promise(resolve => setTimeout(resolve, 10, 2))
    )
    array.push(new Promise(resolve => setTimeout(resolve, 20, 3)))

    const items: Array<number> = []
    for await (const item of array) {
      items.push(item)
    }

    expect(items).toEqual([0, 1, 2, 3, 4])
  })
})
