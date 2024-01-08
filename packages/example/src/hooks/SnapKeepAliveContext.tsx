import { createContext, useCallback, useEffect, useRef, useState } from 'react'

import { keepalive } from '@/utils/snap'

interface SnapKeepAliveContextState {
  startPing(): Promise<void>
  stopPing(): void
}

export const SnapKeepAliveContext = createContext<SnapKeepAliveContextState>({
  startPing: async () => {
    /* no op */
  },
  stopPing: () => {
    /* no op */
  },
})

const KEEP_ALIVE_GAP = 20_000

export const SnapKeepAliveProvider = ({ children }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // To ensure that only one heartbeat between website and snap
  const flagRef = useRef<boolean>(false)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    flagRef.current = false
  }, [])

  const ping = async () => {
    // TODO dispatch error to metamask context when get a error response
    await keepalive()
    timerRef.current = setTimeout(async () => {
      if (flagRef.current) {
        await ping()
      }
    }, KEEP_ALIVE_GAP)
  }

  const startPing = async () => {
    if (flagRef.current) {
      return
    }
    flagRef.current = true
    await ping()
  }

  const stopPing = () => {
    clear()
  }

  useEffect(() => {
    return clear
  }, [])

  return (
    <SnapKeepAliveContext.Provider value={{ startPing, stopPing }}>
      {children}
    </SnapKeepAliveContext.Provider>
  )
}
