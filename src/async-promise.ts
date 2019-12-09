type AsyncPromiseExecutor<T> = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
) => void | Promise<void>

function isPromise(value: void | Promise<void>): value is Promise<void> {
  return (
    typeof value === 'object' && value !== null && typeof value.then === 'function' && typeof value.catch === 'function'
  )
}

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
