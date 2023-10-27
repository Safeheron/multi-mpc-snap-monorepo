import { useTimeout } from 'ahooks'
import { message } from 'antd'
import React, { useEffect, useState } from 'react'

import DynamicQrCode from '@/components/DynamicQrCode'
import ScanDynamicQrCode from '@/components/ScanDynamicQrCode'
import { RTCSignaling, WebRTCChannel } from '@/service/channel/WebRTCChannel'
import { PartyId } from '@/service/types'
import styles from '@/styles/components/WebRTCConnection.module.less'

type BusinessType = 'create' | 'recovery' | 'sign'

interface WebRTCConnectionProps {
  webrtcChannel?: WebRTCChannel
  businessType: BusinessType
}

type ReceivedSignaling = RTCSignaling & {
  name: string
  partyId?: string
  businessType: BusinessType
  version: string
}

const WebRTCConnection: React.FC<WebRTCConnectionProps> = ({
  webrtcChannel,
  businessType,
}) => {
  const [offerAndIce, setOfferAndIce] = useState<string>('')
  const [tipWordsShowState, setTipWordsShowState] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  useTimeout(() => {
    if (scanProgress === 0) {
      setTipWordsShowState(true)
    }
  }, 20_000)

  const [answerAndIce, setAnswerAndIce] = useState<ReceivedSignaling>()

  const init = async () => {
    webrtcChannel!.on('iceReady', () => {
      const localSignalData = webrtcChannel!.getICEAndOffer()
      setOfferAndIce(JSON.stringify({ ...localSignalData, businessType }))
    })
    await webrtcChannel!.createOffer()
  }

  const onScanComplete = async (qrcodeString: string) => {
    let answerAndIceObj: ReceivedSignaling
    try {
      answerAndIceObj = JSON.parse(qrcodeString) as ReceivedSignaling
      if (!answerAndIceObj.sdp || !answerAndIceObj.candidates) {
        throw 'Invalid data, must include sdp and candidates'
      }
      const phoneBusinessType = answerAndIceObj.businessType
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
      webrtcChannel?.setPartyId((answerAndIce.partyId ?? '') as PartyId)
      webrtcChannel?.setAnswerAndICE(answerAndIce.sdp, answerAndIce.candidates)
    }
  }, [answerAndIce])

  useEffect(() => {
    if (webrtcChannel) {
      init()
    }
  }, [webrtcChannel])

  return (
    <div className={styles.webrtcConnection}>
      <div className={styles.mainTitle}>
        Place the QR code in front of your PC Camera
      </div>
      <div className={styles.subTitle}>
        Step 1: Use the mobile App to scan the QR code.
      </div>
      <div className={styles.subTitle}>
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

      <div className={styles.tipTitle}>
        A LAN will then be created for the offline P2P MPC process.
      </div>

      {tipWordsShowState && (
        <div className={'warning'} style={{ marginTop: '10px' }}>
          QR code scanning may not be supported on computers with lower screen
          resolutions or mobile phones with inadequate cameras. Please try again
          on a different device.
        </div>
      )}
    </div>
  )
}

export default WebRTCConnection
