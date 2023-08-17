import { UR, UREncoder } from '@ngraveio/bc-ur'
import { QRCodeSVG } from 'qrcode.react'
import { FC, useEffect, useRef, useState } from 'react'

interface Props {
  message?: string
  encodings?: BufferEncoding
}

const DynamicQrCode: FC<Props> = ({ message, encodings = 'utf-8' }) => {
  const [code, setCode] = useState('')
  const timer = useRef<any>()

  useEffect(() => {
    init()
    return () => clearInterval(timer.current)
  }, [message])

  const init = () => {
    if (!message) return

    const messageBuffer = Buffer.from(message, encodings)

    const ur = UR.fromBuffer(messageBuffer)
    const encoder = new UREncoder(ur, 400, 0, 10)

    clearInterval(timer.current)
    timer.current = setInterval(() => {
      const part = encoder.nextPart()
      displayPart(part)
    }, 300)
  }

  const displayPart = part => {
    setCode(part)
  }

  return <QRCodeSVG value={`${code}`} size={150} />
}

export default DynamicQrCode
