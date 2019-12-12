import { WrapperPromise, WrapperPromiseExecutor } from './wrapper-promise'

export class TimeoutError extends Error {}

export class TimeoutPromise<T> extends WrapperPromise<T> {
  constructor(executor: WrapperPromiseExecutor<T>, timeout: number, error?: Error) {
    super((resolve, reject) => {
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

      // Run the executer
      return executor(resolveWrap, rejectWrap)
    })
  }
}
