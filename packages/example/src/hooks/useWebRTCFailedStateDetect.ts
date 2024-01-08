import { useEffect, useState } from 'react'

import { WebRTCChannel } from '@/service/channel/WebRTCChannel'

type OnChannelClosedCallback = () => void

export default function useWebRTCFailedStateDetect(
  onClosed: OnChannelClosedCallback,
  webrtcChannel?: WebRTCChannel
): () => void {
  const [detectFlag, setDetectFlag] = useState(false)

  const startDetect = () => {
    setDetectFlag(true)
  }

  useEffect(() => {
    if (!!webrtcChannel && detectFlag) {
      const failedState: RTCPeerConnectionState[] = ['failed', 'closed']
      if (failedState.includes(webrtcChannel.peerConnectionState)) {
        onClosed()
      } else {
        webrtcChannel.on('peerClosed', onClosed)
      }
    }
    return () => {
      webrtcChannel?.removeListener('peerClosed', onClosed)
    }
  }, [webrtcChannel, detectFlag])

  return startDetect
}
