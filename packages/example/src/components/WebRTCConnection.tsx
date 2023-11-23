import { useGetState, useTimeout } from 'ahooks'
import { message } from 'antd'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { v4 as uuidV4 } from 'uuid'

import DynamicQrCode from '@/components/DynamicQrCode'
import ScanDynamicQrCode from '@/components/ScanDynamicQrCode'
import { RTCSignaling, WebRTCChannel } from '@/service/channel/WebRTCChannel'

type BusinessType = 'create' | 'recovery' | 'sign'

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
  }
`

const WebRTCConnection: React.FC<WebRTCConnectionProps> = ({
  webrtcChannel,
  businessType,
}) => {
  const [offerAndIce, setOfferAndIce] = useState<string>('')
  const [tipWordsShowState, setTipWordsShowState] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  const [connectPairId, _, getConnectPairId] = useGetState(uuidV4())

  useTimeout(() => {
    if (scanProgress === 0) {
      setTipWordsShowState(true)
    }
  }, 20_000)

  const [answerAndIce, setAnswerAndIce] = useState<ReceivedSignaling>()

  const init = async () => {
    webrtcChannel!.on('iceReady', () => {
      const localSignalData = webrtcChannel!.getICEAndOffer()
      setOfferAndIce(
        JSON.stringify({
          ...localSignalData,
          businessType,
          connectPairId: getConnectPairId(),
        })
      )
    })
    await webrtcChannel!.createOffer()
  }

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
        return
      }

      if (phoneBusinessType !== businessType) {
        message.error(
          `Operation error, web operation type is [${
            businessType ?? 'unknown'
          }] and phone's operation type is [${phoneBusinessType}]`
        )
      } else {
        setAnswerAndIce(answerAndIceObj)
      }
    } catch (e) {
      message.error(e.message ?? 'Parse QrCode data error!')
      return
    }
  }

  useEffect(() => {
    if (scanProgress > 0) {
      setTipWordsShowState(false)
    }
  }, [scanProgress])

  useEffect(() => {
    if (answerAndIce) {
      webrtcChannel?.setName(answerAndIce.name)
      webrtcChannel?.setAnswerAndICE(answerAndIce.sdp, answerAndIce.candidates)
    }
  }, [answerAndIce])

  useEffect(() => {
    if (webrtcChannel) {
      init()
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

      <div style={{ display: 'flex', marginTop: '20px', marginBottom: '30px' }}>
        <DynamicQrCode message={offerAndIce} />
        <div style={{ width: '30px' }} />
        <ScanDynamicQrCode
          onComplete={onScanComplete}
          onProgress={setScanProgress}
        />
      </div>

      <div className={'tip-title'}>
        A LAN will then be created for the offline P2P MPC process.
      </div>

      {tipWordsShowState && (
        <div className={'warning'} style={{ marginTop: '10px' }}>
          QR code scanning may not be supported on computers with lower screen
          resolutions or mobile phones with inadequate cameras. Please try again
          on a different device.
        </div>
      )}
    </WebRTCConnectionContainer>
  )
}

export default WebRTCConnection
