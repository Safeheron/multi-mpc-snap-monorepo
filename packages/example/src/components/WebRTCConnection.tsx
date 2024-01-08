import { useGetState, useTimeout } from 'ahooks'
import { message } from 'antd'
import React, { FC, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { v4 as uuidV4 } from 'uuid'

import FailedImage from '@/assets/failed.png'
import loadingJson from '@/assets/loading.json'
import DynamicQrCode from '@/components/DynamicQrCode'
import Lottie from '@/components/Lottie'
import ScanDynamicQrCode from '@/components/ScanDynamicQrCode'
import { RTCSignaling, WebRTCChannel } from '@/service/channel/WebRTCChannel'
import { logger } from '@/utils/Log'

type BusinessType = 'keygen' | 'recover' | 'sign'

interface WebRTCConnectionProps {
  webrtcChannel?: WebRTCChannel
  businessType: BusinessType
}

type ReceivedSignaling = RTCSignaling & {
  name: string
  businessType: BusinessType
  version: string
  connectPairId: string
}

const WebRTCConnectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 46px;
  padding-right: 26px;
  color: #262833;
  .connect-container {
    display: flex;
    margin-top: 20px;
    margin-bottom: 20px;
  }
  .main-title {
    font-size: 14px;
    font-weight: bold;
    line-height: 20px;
    margin-bottom: 5px;
  }
  .sub-title {
    font-size: 12px;
    line-height: 17px;
  }
  .tip-title {
    color: #6b6d7c;
    font-size: 12px;
  }
`

function extractIPFromICECandidates(iceCandidates: any[]) {
  const ipAddresses: string[] = []
  iceCandidates.forEach(candidate => {
    if (candidate.candidate) {
      const ipMatch = candidate.candidate.match(/(?:\d{1,3}\.){3}\d{1,3}/)
      if (ipMatch) {
        ipAddresses.push(ipMatch[0])
      }
    }
  })
  return ipAddresses
}

function isSameSubnet(ip1: string, ip2: string) {
  const subnet1 = ip1.split('.').slice(0, 3).join('.')
  const subnet2 = ip2.split('.').slice(0, 3).join('.')
  return subnet1 === subnet2
}

function areCandidatesInSameSubnet(
  localICECandidates: any[],
  remoteICECandidates: any[]
) {
  const localIPs = extractIPFromICECandidates(localICECandidates)
  const remoteIPs = extractIPFromICECandidates(remoteICECandidates)

  for (const localIP of localIPs) {
    for (const remoteIP of remoteIPs) {
      if (isSameSubnet(localIP, remoteIP)) {
        return true
      }
    }
  }

  return false
}

type RTCState = 'init' | 'connecting' | 'failed'

const WebRTCConnection: React.FC<WebRTCConnectionProps> = ({
  webrtcChannel,
  businessType,
}) => {
  const scanDynamicQrcodeRef =
    useRef<React.ElementRef<typeof ScanDynamicQrCode>>(null)

  const [offerAndIce, setOfferAndIce, getOfferAndIce] = useGetState<string>('')
  const [scanHardTips, setScanHardTips] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  const [rtcState, setRtcState] = useState<RTCState>('init')

  const [connectPairId, _, getConnectPairId] = useGetState(uuidV4())

  useTimeout(() => {
    if (scanProgress === 0) {
      setScanHardTips(true)
    }
  }, 30_000)

  const [answerAndIce, setAnswerAndIce] = useState<ReceivedSignaling>()

  const onScanComplete = async (qrcodeString: string) => {
    let answerAndIceObj: ReceivedSignaling
    try {
      answerAndIceObj = JSON.parse(qrcodeString) as ReceivedSignaling
      if (!answerAndIceObj.sdp || !answerAndIceObj.candidates) {
        throw 'Invalid QR code data, must include sdp and candidates'
      }
      const phoneBusinessType = answerAndIceObj.businessType

      if (getConnectPairId() !== answerAndIceObj.connectPairId) {
        message.error(
          `QR code not match. website pairId is [${getConnectPairId()}] but phone's pairId is [${
            answerAndIceObj.connectPairId
          }]`,
          8
        )
        scanDynamicQrcodeRef.current?.resume()
        return
      }

      if (phoneBusinessType !== businessType) {
        message.error(
          `Operation error, web operation type is [${
            businessType ?? 'unknown'
          }] and phone's operation type is [${phoneBusinessType}]`
        )
        scanDynamicQrcodeRef.current?.resume()
        return
      }

      const localICECandidates = JSON.parse(getOfferAndIce()).candidates
      const remoteICECandidates = answerAndIceObj.candidates

      const areInSameSubnet = areCandidatesInSameSubnet(
        localICECandidates,
        remoteICECandidates
      )

      /**
       * When the IPs do not match, it is not 100% sure whether they are in the same LAN,
       * so only give a prompt.
       */
      if (!areInSameSubnet) {
        message.warning(
          'It seems that your mobile phone and computer are not in the same LAN, which may prevent the connection from being established.',
          5
        )
      }

      setAnswerAndIce(answerAndIceObj)
    } catch (e) {
      message.error(e.message ?? 'Parse QrCode data error!')
      scanDynamicQrcodeRef.current?.resume()
      return
    }
  }

  useEffect(() => {
    if (scanProgress > 0) {
      setScanHardTips(false)
    }
  }, [scanProgress])

  useEffect(() => {
    if (answerAndIce) {
      webrtcChannel?.setName(answerAndIce.name)
      webrtcChannel
        ?.setAnswerAndICE(answerAndIce.sdp, answerAndIce.candidates)
        .then(() => {
          setRtcState('connecting')
        })
        .catch(e => {
          console.error(
            'webrtc set remote answer and ice candidates failed with error: ',
            e
          )
        })
    }
  }, [answerAndIce])

  useEffect(() => {
    const iceReadyListener = () => {
      const localSignalData = webrtcChannel?.getICEAndOffer()
      setOfferAndIce(
        JSON.stringify({
          ...localSignalData,
          businessType,
          connectPairId: getConnectPairId(),
        })
      )
    }
    const iceConnectionStateChangedListener = (
      state: RTCIceConnectionState
    ) => {
      if (state === 'failed') {
        setRtcState('failed')
      }
    }

    const peerStateChangeListener = (peerState: RTCPeerConnectionState) => {
      if (peerState === 'failed') {
        setRtcState('failed')
      }
    }

    if (webrtcChannel) {
      webrtcChannel.on('iceReady', iceReadyListener)
      webrtcChannel.on(
        'iceConnectionStateChanged',
        iceConnectionStateChangedListener
      )
      webrtcChannel.on('peerStateChanged', peerStateChangeListener)

      webrtcChannel.createOffer().catch(e => {
        console.error('WebRTC cannot createOffer: ', e)
        message.error('WebRTC peerConnection cannot create an offer.', 6)
      })
    }

    return () => {
      webrtcChannel?.removeListener('iceReady', iceReadyListener)
      webrtcChannel?.removeListener(
        'iceConnectionStateChanged',
        iceConnectionStateChangedListener
      )
    }
  }, [webrtcChannel])

  return (
    <WebRTCConnectionContainer>
      <div className={'main-title'}>
        Place the QR code in front of your PC Camera
      </div>
      <div className={'sub-title'}>
        Step 1: Use the mobile App to scan the QR code.
      </div>
      <div className={'sub-title'}>
        Step 2: Place the QR code of your mobile App in front of your desktop's
        camera until the progress reaches 100%.
      </div>

      <div className={'connect-container'}>
        {rtcState === 'connecting' && <Connecting />}
        {rtcState === 'failed' && <ConnectingFailed />}
        {rtcState === 'init' && (
          <>
            <DynamicQrCode message={offerAndIce} />
            <div style={{ width: '30px' }} />
            <ScanDynamicQrCode
              ref={scanDynamicQrcodeRef}
              onComplete={onScanComplete}
              onProgress={setScanProgress}
            />
          </>
        )}
      </div>

      {rtcState === 'init' && (
        <div className={'tip-title'}>
          The screen is blurred, but it will not affect the reading.
        </div>
      )}

      {scanHardTips && rtcState === 'init' && (
        <div
          className={'warning'}
          style={{ marginTop: '10px', fontSize: '12px' }}>
          QR code scanning may not be supported on computers with lower screen
          resolutions or mobile phones with inadequate cameras. Please try again
          on a different device.
        </div>
      )}
    </WebRTCConnectionContainer>
  )
}

export default WebRTCConnection

const ConnectionContainer = styled.div`
  position: relative;
  height: 220px;
  width: 100%;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 40px;
  .tip {
    position: absolute;
    bottom: 30px;
    color: #496ce9;
  }
  .failed {
    width: 50px;
    margin-bottom: 12px;
  }
  .failed-text {
    color: #d21313;
    font-size: 12px;
    text-align: center;
  }
`

const Connecting: FC = () => {
  return (
    <ConnectionContainer>
      <Lottie data={loadingJson} />
      <p className={'tip'}>Connecting...</p>
    </ConnectionContainer>
  )
}

const ConnectingFailed: FC = () => {
  return (
    <ConnectionContainer>
      <img
        className={'failed'}
        src={FailedImage}
        alt={'WebRTC Connection failed.'}
      />
      <div className={'failed-text'}>
        Connection failed. Please check if your phone and computer are on the
        same local network or try switching to a different network. Another
        option is to turn on the hotspot on one phone for other devices to
        connect to.
      </div>
    </ConnectionContainer>
  )
}
