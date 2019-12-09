export function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Promise<T>).then === 'function' &&
    typeof (value as Promise<T>).catch === 'function'
  )
}
