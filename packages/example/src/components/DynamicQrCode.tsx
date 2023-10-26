import { UR, UREncoder } from '@ngraveio/bc-ur'
import pako from 'pako'
import { QRCodeSVG } from 'qrcode.react'
import { FC, useEffect, useRef, useState } from 'react'

interface Props {
  message?: string
}

const DynamicQrCode: FC<Props> = ({ message }) => {
  const [code, setCode] = useState('')
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
    const encoder = new UREncoder(ur, 300, 0, 10)

    clearInterval(timer.current)
    timer.current = setInterval(() => {
      const part = encoder.nextPart()
      displayPart(part)
    }, 300)
  }

  const displayPart = part => {
    setCode(part)
  }

  return <QRCodeSVG value={`${code}`} size={200} />
}

export default DynamicQrCode
