import { isPromise } from './promise-utils'

export class AsyncArray<T> extends Array<T | Promise<T>> {
  constructor(...items: Array<T | Promise<T>>) {
    for (const item of items) {
      if (isPromise(item)) {
        item.catch(e => e)
      }
    }
    super(...items)
  }

  push(...items: Array<T | Promise<T>>): number {
    for (const item of items) {
      if (isPromise(item)) {
        item.catch(e => e)
      }
    }
    return super.push(...items)
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

type DeferredPromise<T> = {
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}

// TODO: Does it make sense to extend from AsyncArray?
export class AsyncOrderedArray<T> extends AsyncArray<T> {
  private orderedDeferred: Array<DeferredPromise<T>>

  constructor(...items: Array<T | Promise<T>>) {
    const orderedDeferred: Array<DeferredPromise<T>> = []
    const orderedPromises: Array<Promise<T>> = []
    const simpleItems: Array<T> = []
    for (const item of items) {
      if (isPromise(item)) {
        orderedPromises.push(
          new Promise<T>((resolve, reject) => {
            orderedDeferred.push({ resolve, reject })
          })
        )
        item
          .then(res => {
            const promise = orderedDeferred.shift()
            if (promise) {
              promise.resolve(res)
            }
          })
          .catch(e => {
            const promise = orderedDeferred.shift()
            if (promise) {
              promise.reject(e)
            }
          })
      } else {
        simpleItems.push(item)
      }
    }
    super(...simpleItems, ...orderedPromises)
    this.orderedDeferred = orderedDeferred
  }

  push(...items: Array<T | Promise<T>>): number {
    const orderedPromises: Array<Promise<T>> = []
    for (const item of items) {
      orderedPromises.push(
        new Promise<T>((resolve, reject) => {
          this.orderedDeferred.push({ resolve, reject })
        })
      )
      if (isPromise(item)) {
        item
          .then(res => {
            const promise = this.orderedDeferred.shift()
            if (promise) {
              promise.resolve(res)
            }
          })
          .catch(e => {
            const promise = this.orderedDeferred.shift()
            if (promise) {
              promise.reject(e)
            }
          })
      } else {
        const promise = this.orderedDeferred.shift()
        if (promise) {
          promise.resolve(item)
        }
      }
    }
    return super.push(...orderedPromises)
  }
}
