import { isPromise } from './promise-utils'
import { WrapperPromise, WrapperPromiseExecutor } from './wrapper-promise'

export class AsyncPromise<T> extends WrapperPromise<T> {
  constructor(executor: WrapperPromiseExecutor<T>) {
    super((resolve, reject) => {
      const promise = executor(resolve, reject)
      if (isPromise(promise)) {
        promise.catch(e => {
          reject(e)
        })
      }
    })
  }
}
