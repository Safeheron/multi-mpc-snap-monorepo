import { Button, Form, Input } from 'antd'
import React, { useEffect, useRef, useState } from 'react'

import DynamicQrCode from '@/components/DynamicQrCode'
import ScanDynamicQrCode from '@/components/ScanDynamicQrCode'
import { RTCSignaling, WebRTCChannel } from '@/service/channel/WebRTCChannel'

const WebRTC = () => {
  const [answerAndIce, setAnswerAndIce] = useState<string>()

  const [message, setMessage] = useState<string>('')

  const channelRef = useRef<WebRTCChannel>()

  const [sdpAndIce, setSdpAndIce] = useState<string>()

  const [channelState, setChannelState] = useState(false)

  const init = async () => {
    channelRef.current = new WebRTCChannel('webrtc-test')

    channelRef.current.on('iceReady', () => {
      const signalingData = channelRef.current!.getICEAndOffer()
      console.log('signaling data: ', signalingData)
      setSdpAndIce(JSON.stringify(signalingData))
    })

    channelRef.current.on('channelOpen', () => setChannelState(true))
    channelRef.current.on('channelClose', () => setChannelState(false))
  }

  const initChannel = async () => {
    await channelRef.current!.createOffer()
  }

  const setUpAnswer = async (props?: string) => {
    if (!props && !answerAndIce) {
      alert('please input data')
      return
    }

    const params = props || answerAndIce

    const signalingData = JSON.parse(params!) as RTCSignaling

    await channelRef.current!.setAnswerAndICE(
      signalingData.sdp,
      signalingData.candidates
    )
  }

  const sendMessage = async () => {
    channelRef.current!.sendMessage(message)
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div style={{ padding: '30px' }}>
      <Button onClick={initChannel}>
        创建 peer connection 并且 create offer
      </Button>

      <br />
      <h3>sdp and ice: </h3>
      <Input disabled value={sdpAndIce} />
      <DynamicQrCode message={sdpAndIce} />

      <br />

      <ScanDynamicQrCode onComplete={setUpAnswer} />

      <Form.Item>
        <Input
          placeholder={'请输入phone端的 answer 和 ice candidate'}
          value={answerAndIce}
          style={{ width: '300px' }}
          onChange={e => setAnswerAndIce(e.target.value)}
        />
        <Button onClick={() => setUpAnswer()}>设置 answer 和 ice</Button>
      </Form.Item>

      <Form.Item>
        <div>数据通道状态: {channelState ? '打开' : '关闭'}</div>
        <Input
          placeholder={'请输入消息'}
          value={message}
          style={{ width: '300px' }}
          onChange={e => setMessage(e.target.value)}
        />
        <Button onClick={sendMessage}>发送消息</Button>
      </Form.Item>
    </div>
  )
}

export default WebRTC
