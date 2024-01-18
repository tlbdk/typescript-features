import { WrapperPromise } from './wrapper-promise'

export class DeferredPromise<T> extends WrapperPromise<T> {
  public resolve(value: T | PromiseLike<T>): void {
    return this.res(value)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public reject(reason?: any): void {
    return this.rej(reason)
  }
}
