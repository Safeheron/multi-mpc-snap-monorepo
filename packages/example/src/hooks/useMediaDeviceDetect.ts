import { useEffect, useState } from 'react'

import { detectMediaAbility } from '@/utils/mediaDevice'

export function useMediaDeviceDetect() {
  const [detected, setDetected] = useState(false)
  const [support, setSupport] = useState(false)
  const [errMessage, setErrMessage] = useState<string | undefined>('')

  const detect = async () => {
    const result = await detectMediaAbility()
    setSupport(result.support)
    setErrMessage(result.message)
    setDetected(true)
  }

  useEffect(() => {
    detect()
  }, [])

  return {
    detected,
    support,
    errMessage,
  }
}
