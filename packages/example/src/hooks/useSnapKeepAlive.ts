import { useContext, useEffect } from 'react'

import { SnapKeepAliveContext } from '@/hooks/SnapKeepAliveContext'

export default function useSnapKeepAlive() {
  const { startPing, stopPing } = useContext(SnapKeepAliveContext)

  useEffect(() => {
    startPing()
    return () => stopPing()
  }, [])
}
