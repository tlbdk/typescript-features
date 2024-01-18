export interface AsyncStateMachineOptions {
  readTimeout?: number
}

export type InListener<T> = (obj: T) => void
export type OutListener<T> = (obj: T) => void
export type ErrorListener = (err: Error) => void

export abstract class AsyncStateMachine<I, O> {
  private readTimeout: number
  private inListeners: InListener<I>[] = []
  private outListeners: OutListener<O>[] = []
  private errorListeners: ErrorListener[] = []
  private completed: boolean = false

  public constructor(options?: AsyncStateMachineOptions) {
    this.readTimeout = options?.readTimeout ?? 0
    setImmediate(() => {
      this.init()
    })
  }

  public hasCompleted(): boolean {
    return this.completed
  }

  public abortAndReset(): void {
    this.removeAllListeners('in')
    this.init()
  }

  public on(event: 'in', listener: InListener<I>): this
  public on(event: 'out', listener: OutListener<O>): this
  public on(event: 'error', listener: ErrorListener): this
  // TODO: Implement completed
  public on(event: 'completed', listener: ErrorListener): this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    switch (event) {
      case 'in': {
        this.inListeners.push(listener)
        break
      }
      case 'out': {
        this.outListeners.push(listener)
        break
      }
      case 'error': {
        this.errorListeners.push(listener)
        break
      }
      default: {
        throw new Error(`Unknown event type ${event.toString()}`)
      }
    }
    return this
  }

  public emit(event: 'in', ...args: Array<Parameters<InListener<I>>[0]>): boolean
  public emit(event: 'error', ...args: Array<Parameters<ErrorListener>[0]>): boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public emit(event: string | symbol, ...args: any[]): boolean {
    switch (event) {
      case 'in': {
        for (const listener of this.inListeners) {
          for (const obj of args) {
            listener(obj)
          }
        }
        break
      }
      case 'error': {
        for (const listener of this.errorListeners) {
          for (const obj of args) {
            listener(obj)
          }
        }
        break
      }
      default: {
        throw new Error(`Unknown event type ${event.toString()}`)
      }
    }
    return true
  }

  public removeAllListeners(event: 'in'): this
  public removeAllListeners(event: 'out'): this
  public removeAllListeners(event: 'error'): this
  public removeAllListeners(event?: string | symbol | undefined): this {
    switch (event) {
      case 'in': {
        this.inListeners.length = 0
        break
      }
      case 'out': {
        this.outListeners.length = 0
        break
      }
      case 'error': {
        this.errorListeners.length = 0
        break
      }
    }
    return this
  }

  public removeListener(event: 'in', listener: InListener<I>): this
  public removeListener(event: 'out', listener: OutListener<O>): this
  public removeListener(event: 'error', listener: ErrorListener): this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
    switch (event) {
      case 'in': {
        this.inListeners = this.inListeners.filter(l => l !== listener)
        break
      }
      case 'out': {
        this.outListeners = this.outListeners.filter(l => l !== listener)
        break
      }
      case 'error': {
        this.errorListeners = this.errorListeners.filter(l => l !== listener)
        break
      }
      default: {
        throw new Error(`Unknown event type ${event.toString()}`)
      }
    }
    return this
  }

  protected writeMessages(...objs: O[]): void {
    for (const listener of this.outListeners) {
      for (const obj of objs) {
        listener(obj)
      }
    }
  }

  protected async waitFor<T extends I>(predicate: (obj: I) => boolean, timeout = 1000): Promise<T> {
    timeout = timeout ?? this.readTimeout
    try {
      return await new Promise<T>((resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
          reject(new Error(`Timed out waiting for message`))
        }, timeout)

        const listener: InListener<I> = obj => {
          if (predicate(obj)) {
            clearTimeout(timeoutHandle)
            this.removeListener('in', listener)
            resolve(obj as T)
          }
        }
        this.on('in', obj => listener(obj))
      })
    } catch (e) {
      Error.captureStackTrace(e)
      throw e
    }
  }

  private init(): void {
    this.stateMachine()
      .then(() => {
        this.completed = true
      })
      .catch(e => {
        for (const listener of this.errorListeners) {
          listener(e)
        }
      })
  }

  protected abstract stateMachine(): Promise<void>
}
