import { UR, UREncoder } from '@ngraveio/bc-ur'
import { Modal } from 'antd'
import pako from 'pako'
import { QRCodeSVG } from 'qrcode.react'
import { FC, useEffect, useRef, useState } from 'react'

interface Props {
  message?: string
}

const DynamicQrCode: FC<Props> = ({ message }) => {
  const [code, setCode] = useState('')
  const [zoomState, setZoomState] = useState(false)

  const timer = useRef<any>()

  useEffect(() => {
    init()
    return () => clearInterval(timer.current)
  }, [message])

  const init = () => {
    if (!message) return

    const compressedMessage = pako.deflate(message) as Buffer
    // @ts-ignore
    const messageBuffer = Buffer.from(compressedMessage)

    const ur = UR.fromBuffer(messageBuffer)
    const encoder = new UREncoder(ur, 200, 0, 10)

    clearInterval(timer.current)
    timer.current = setInterval(() => {
      const part = encoder.nextPart()
      displayPart(part)
    }, 300)
  }

  const displayPart = part => {
    setCode(part)
  }

  return (
    <>
      <div>
        <QRCodeSVG
          value={`${code}`}
          size={200}
          onClick={() => setZoomState(true)}
        />
        <div style={{ textAlign: 'center' }}>Click to zoom in</div>
      </div>
      <Modal
        open={zoomState}
        width={500}
        centered
        footer={zoomState}
        closable
        onCancel={() => setZoomState(false)}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '50px 0',
          }}>
          <QRCodeSVG value={`${code}`} size={400} />
        </div>
      </Modal>
    </>
  )
}

export default DynamicQrCode
