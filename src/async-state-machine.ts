export interface AsyncStateMachineOptions {
  readTimeout?: number
}

export type InListener<T> = (item: T) => void
export type OutListener<T> = (item: T) => void
export type StateListener<T> = (item: T) => void
export type ErrorListener = (err: Error) => void

export abstract class AsyncStateMachine<S, I, O> {
  protected state: 'started' | S | 'completed' = 'started'

  private readTimeout: number
  private inListeners: InListener<I>[] = []
  private inItems: Array<I> = []
  private outListeners: OutListener<O>[] = []
  private outItems: Array<O> = []
  private stateListeners: StateListener<S>[] = []
  private errorListeners: ErrorListener[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private abortList: Array<(reason?: any) => void> = []

  public constructor(options?: AsyncStateMachineOptions) {
    this.readTimeout = options?.readTimeout ?? 1000
    setImmediate(() => {
      this.init()
    })
  }

  public getState(): typeof this.state {
    return this.state
  }

  public hasCompleted(): boolean {
    return this.state === 'completed'
  }

  public abortAndReset(): void {
    this.removeAllListeners('in')
    for (const reject of this.abortList) {
      reject()
    }
    this.init()
  }

  public on(event: 'in', listener: InListener<I>): this
  public on(event: 'out', listener: OutListener<O>): this
  public on(event: 'error', listener: ErrorListener): this
  public on(event: 'state', listener: ErrorListener): this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    switch (event) {
      case 'in': {
        this.inListeners.push(listener)
        if (this.inItems.length > 0) {
          listener(...this.inItems)
          this.inItems.length = 0
        }
        break
      }
      case 'out': {
        this.outListeners.push(listener)
        if (this.outItems.length > 0) {
          listener(...this.outItems)
          this.outItems.length = 0
        }
        break
      }
      case 'error': {
        this.errorListeners.push(listener)
        break
      }
      case 'state': {
        this.stateListeners.push(listener)
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
        if (this.inListeners.length === 0) {
          this.inItems.push(...args)
        } else {
          for (const listener of this.inListeners) {
            for (const item of args) {
              listener(item)
            }
          }
        }
        break
      }
      case 'error': {
        for (const listener of this.errorListeners) {
          for (const item of args) {
            listener(item)
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

  public async waitForOut(predicate: (m: O) => boolean, timeout?: number): Promise<O> {
    timeout = timeout ?? this.readTimeout
    try {
      return await new Promise((resolve, reject) => {
        this.registerAbort(reject)
        const timeoutHandle = setTimeout(() => {
          reject(new Error(`Timed out waiting for out`))
        }, timeout)

        const listener: OutListener<O> = item => {
          const res = predicate(item)
          if (res) {
            clearTimeout(timeoutHandle)
            this.removeListener('out', listener)
            resolve(item)
          }
        }
        this.on('out', listener)
      })
    } catch (e) {
      // Fix stack trace
      Error.captureStackTrace(e, this.waitForOut)
      throw e
    }
  }

  protected setState(state: typeof this.state): void {
    this.state = state
  }

  protected write(...items: O[]): void {
    if (this.outListeners.length === 0) {
      this.outItems.push(...items)
    } else {
      for (const listener of this.outListeners) {
        for (const item of items) {
          listener(item)
        }
      }
    }
  }

  protected async waitForIn<T extends I>(predicate: (item: I) => boolean, timeout?: number): Promise<T> {
    timeout = timeout ?? this.readTimeout
    try {
      return await new Promise<T>((resolve, reject) => {
        this.registerAbort(reject)
        const timeoutHandle = setTimeout(() => {
          reject(new Error(`Timed out waiting for in`))
        }, timeout)

        const listener: InListener<I> = item => {
          if (predicate(item)) {
            clearTimeout(timeoutHandle)
            this.removeListener('in', listener)
            resolve(item as T)
          }
        }
        this.on('in', listener)
      })
    } catch (e) {
      Error.captureStackTrace(e, this.waitForIn)
      throw e
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected registerAbort(reject: (reason?: any) => void): void {
    this.abortList.push(reject)
  }

  private init(): void {
    this.setState('started')
    this.run()
      .then(() => {
        this.state = 'completed'
      })
      .catch(e => {
        if (e instanceof AbortedError) {
          // Ignore
        } else {
          for (const listener of this.errorListeners) {
            listener(e)
          }
        }
      })
  }

  protected abstract reset(): Promise<void>
  protected abstract run(): Promise<void>
}

export class AbortedError extends Error {
  public constructor(message: string, cause?: Error) {
    super(message, { cause })
    this.name = this.constructor.name
  }
}
