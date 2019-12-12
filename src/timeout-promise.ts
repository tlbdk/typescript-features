import { isPromise } from './promise-utils'

export class TimeoutError extends Error {}

type TimeoutPromiseExecutor<T> = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
) => void | Promise<void>

export class TimeoutPromise<T> implements Promise<T> {
  private readonly promise: Promise<T>

  constructor(executor: TimeoutPromiseExecutor<T>, timeout: number, error?: Error) {
    // Create wrapper
    const wrapper: TimeoutPromiseExecutor<T> = (resolve, reject) => {
      // Start timeout
      const timeoutRef = setTimeout(() => {
        if (error) {
          reject(error)
        } else {
          reject(new TimeoutError())
        }
      }, timeout)

      // Wrap resolve and reject so we clear the timeout
      const resolveWrap = (arg?: T | PromiseLike<T>): void => {
        clearTimeout(timeoutRef)
        resolve(arg)
      }
      const rejectWrap = (e?: any): void => {
        clearTimeout(timeoutRef)
        reject(e)
      }

      // Run the executer and capture output
      const maybePromise = executor(resolveWrap, rejectWrap)

      // Reject if the executer returns a promise the rejects
      if (isPromise(maybePromise)) {
        maybePromise.catch(e => {
          rejectWrap(e)
        })
      }
    }

    this.promise = new Promise(wrapper)
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
