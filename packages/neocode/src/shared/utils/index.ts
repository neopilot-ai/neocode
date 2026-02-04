/**
 * Shared utility functions
 */

export const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduce((acc, fn) => fn(acc), value)

export const compose =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reverse().reduce((acc, fn) => fn(acc), value)

export const memoize = <T, R>(fn: (arg: T) => R): ((arg: T) => R) => {
  const cache = new Map<T, R>()
  return (arg: T) => {
    if (cache.has(arg)) return cache.get(arg) as R
    const result = fn(arg)
    cache.set(arg, result)
    return result
  }
}

export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

export const throttle = <T extends (...args: any[]) => any>(fn: T, interval: number): T => {
  let lastCall = 0
  return ((...args: any[]) => {
    const now = Date.now()
    if (now - lastCall >= interval) {
      lastCall = now
      fn(...args)
    }
  }) as T
}

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export const retry = async <T>(fn: () => Promise<T>, { maxAttempts = 3, delay = 1000 } = {}): Promise<T> => {
  let lastError: Error | undefined
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < maxAttempts - 1) await sleep(delay * Math.pow(2, attempt))
    }
  }
  throw lastError
}
