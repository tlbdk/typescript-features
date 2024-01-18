import { isPromise } from './promise-utils'

export type WrapperPromiseExecutor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (reason?: any) => void
) => void | Promise<void>

export class WrapperPromise<T> implements Promise<T> {
  protected res!: (value: T | PromiseLike<T>) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected rej!: (reason?: any) => void
  private readonly promise: Promise<T>

  public constructor(executor: WrapperPromiseExecutor<T>) {
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

  public get [Symbol.toStringTag](): string {
    return 'WrapperPromise'
  }

  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected)
  }

  public catch<TResult = never>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected)
  }

  public finally(onfinally?: (() => void) | null | undefined): Promise<T> {
    return this.promise.finally(onfinally)
  }
}
