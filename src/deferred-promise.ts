import { isPromise } from './promise-utils'
import { WrapperPromise, WrapperPromiseExecutor } from './wrapper-promise'

export class DeferredPromise<T> extends WrapperPromise<T> {
  resolve(value?: T | PromiseLike<T>): void {
    return this.res(value)
  }
  reject(reason?: any): void {
    return this.rej(reason)
  }
}
