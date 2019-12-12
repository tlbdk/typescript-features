import { isPromise } from './promise-utils'

export type WrapperPromiseExecutor<T> = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
) => void | Promise<void>

export class WrapperPromise<T> implements Promise<T> {
  private readonly promise: Promise<T>
  protected res!: (value?: T | PromiseLike<T>) => void
  protected rej!: (reason?: any) => void

  constructor(executor: WrapperPromiseExecutor<T>) {
    this.promise = new Promise((resolve, reject) => {
      this.res = resolve
      this.rej = reject
      const promise = executor(resolve, reject)
      if (isPromise(promise)) {
        promise.catch(e => {
          reject(e)
        })
      }
    })
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected)
  }
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected)
  }
  [Symbol.toStringTag]: string
  finally(onfinally?: (() => void) | null | undefined): Promise<T> {
    return this.promise.finally(onfinally)
  }
}
