import { isPromise } from './promise-utils'

type AsyncPromiseExecutor<T> = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
) => void | Promise<void>

export class AsyncPromise<T> extends Promise<T> {
  constructor(executor: AsyncPromiseExecutor<T>) {
    const asyncWrapper: AsyncPromiseExecutor<T> = (resolve, reject) => {
      const promise = executor(resolve, reject)
      if (isPromise(promise)) {
        promise.catch(e => {
          reject(e)
        })
      }
    }
    super(asyncWrapper)
  }
}
