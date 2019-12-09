import { isPromise } from './promise-utils'

export class AsyncArray<T> extends Array<T> {
  constructor(...items: T[]) {
    for (const item of items) {
      if (isPromise(item)) {
        item.catch(e => e)
      }
    }
    super(...items)
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    const arrayIterator = this[Symbol.iterator]()
    return {
      next: async () => {
        const next = arrayIterator.next()
        if (next.done) {
          return next
        }
        if (isPromise(next.value)) {
          const result = await next.value
          return {
            done: false,
            value: result
          }
        }
        return { done: false, value: next.value }
      }
    }
  }
}
