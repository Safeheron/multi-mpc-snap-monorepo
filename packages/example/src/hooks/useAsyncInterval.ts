import { useEffect, useRef } from 'react'

type PromisedFn = (...args: any) => Promise<any>

export default function useAsyncInterval(
  fn: PromisedFn,
  delay: number,
  immediate = false
) {
  const savedCallback = useRef<PromisedFn>()
  const isPausedRef = useRef(immediate)
  const timeoutIdRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    savedCallback.current = fn
  }, [fn])

  const pause = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      isPausedRef.current = true
    }
  }

  const resume = () => {
    if (isPausedRef.current) {
      isPausedRef.current = false
      scheduleTimeout()
    }
  }

  const scheduleTimeout = () => {
    timeoutIdRef.current = setTimeout(async () => {
      if (!isPausedRef.current) {
        savedCallback.current && (await savedCallback.current())
        scheduleTimeout() // Schedule the next call after fn has completed
      }
    }, delay)
  }

  useEffect(() => {
    if (!isPausedRef.current) {
      scheduleTimeout()
    }
    return () => clearTimeout(timeoutIdRef.current)
  }, [delay])

  return { pause, resume }
}
