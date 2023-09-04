import { useEffect, useRef, useState } from 'react'

type PromisedFn = (...args: any) => Promise<any>

export default function useAsyncInterval(fn: PromisedFn, delay) {
  const savedCallback = useRef<PromisedFn>()
  const isPausedRef = useRef(false)
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
    timeoutIdRef.current = setTimeout(() => {
      savedCallback.current &&
        savedCallback.current().finally(() => {
          if (!isPausedRef.current) {
            scheduleTimeout()
          }
        })
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
